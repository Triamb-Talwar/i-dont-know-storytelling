import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_CONFIG, type Category } from '@lib/categories';
import { drawNodeShape } from './NodeShapes';
import { useGraphPhysics, type SimNode, type SimLink } from './useGraphPhysics';

interface RawNode {
  id: string;
  title: string;
  category: Category;
  visibility: 'public' | 'private';
  size: number;
  age_days: number;
  tags: string[];
}

interface RawEdge {
  source: string;
  target: string;
  strength: number;
  reason?: string;
}

interface GraphPayload {
  nodes: RawNode[];
  edges: RawEdge[];
}

interface Camera {
  x: number;
  y: number;
  k: number;
}

const BASE_RADIUS_PUBLIC = 22;
const BASE_RADIUS_PRIVATE = 4;
const DRAG_THRESHOLD = 4;
const IDLE_MS = 8000;
const HOVER_LIFT = 3;
const CONNECTED_LEAN = 0.05;
const BREADCRUMB_DECAY_MS = 30_000;
const BREADCRUMB_KEY = 'idks_breadcrumbs';

function getBreadcrumbs(): { edge: string; t: number }[] {
  try {
    const raw = sessionStorage.getItem(BREADCRUMB_KEY);
    if (!raw) return [];
    const items = JSON.parse(raw) as { edge: string; t: number }[];
    const now = Date.now();
    return items.filter((b) => now - b.t < BREADCRUMB_DECAY_MS);
  } catch {
    return [];
  }
}

function addBreadcrumb(fromId: string, toId: string): void {
  try {
    const key = [fromId, toId].sort().join('::');
    const crumbs = getBreadcrumbs();
    crumbs.push({ edge: key, t: Date.now() });
    sessionStorage.setItem(BREADCRUMB_KEY, JSON.stringify(crumbs.slice(-20)));
  } catch { /* noop */ }
}

function breathScale(ageDays: number, t: number): number {
  const speed = ageDays < 30 ? 1.8 : ageDays < 180 ? 1.2 : 0.7;
  const amp = ageDays < 30 ? 0.035 : 0.018;
  return 1 + Math.sin(t * speed) * amp;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ageSaturation(ageDays: number): number {
  // 1.0 until 180 days, then decays to 0.7 at 365, stable after.
  if (ageDays < 180) return 1;
  if (ageDays < 365) return 1 - (0.3 * (ageDays - 180)) / 185;
  return 0.7;
}

export default function Graph() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraRef = useRef<Camera>({ x: 0, y: 0, k: 1 });
  const hoverRef = useRef<number | null>(null);
  const dragRef = useRef<{
    active: boolean;
    moved: boolean;
    startX: number;
    startY: number;
    camStartX: number;
    camStartY: number;
  } | null>(null);
  const lastInteractionRef = useRef<number>(performance.now());
  const driftAngleRef = useRef<number>(Math.random() * Math.PI * 2);
  const timeRef = useRef<number>(0);

  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [payload, setPayload] = useState<GraphPayload | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Fetch graph.json
  useEffect(() => {
    let alive = true;
    fetch('/graph.json')
      .then((r) => r.json() as Promise<GraphPayload>)
      .then((data) => {
        if (alive) {
          setPayload(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (alive) setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, []);

  // Size observer
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.floor(width), h: Math.floor(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build sim nodes/edges once payload lands
  const { simNodes, simLinks, adjacency } = useMemo(() => {
    if (!payload) return { simNodes: [] as SimNode[], simLinks: [] as SimLink[], adjacency: new Map<string, Set<string>>() };
    const nodes: SimNode[] = payload.nodes.map((n) => ({
      ...n,
      radius: n.visibility === 'public' ? BASE_RADIUS_PUBLIC * n.size : BASE_RADIUS_PRIVATE,
    }));
    const links: SimLink[] = payload.edges.map((e) => ({ ...e }));
    const adj = new Map<string, Set<string>>();
    for (const n of nodes) adj.set(n.id, new Set());
    for (const e of payload.edges) {
      adj.get(e.source)?.add(e.target);
      adj.get(e.target)?.add(e.source);
    }
    return { simNodes: nodes, simLinks: links, adjacency: adj };
  }, [payload]);

  // Render function — draws current state to canvas
  const renderRef = useRef<() => void>(() => {});
  renderRef.current = () => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w || !size.h) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    // starfield-like subtle dots for depth
    ctx.fillStyle = 'rgba(255,255,255,0.025)';
    for (let i = 0; i < 60; i++) {
      const sx = (i * 97) % size.w;
      const sy = (i * 137 + 40) % size.h;
      ctx.fillRect(sx, sy, 1, 1);
    }

    const cam = cameraRef.current;
    ctx.translate(size.w / 2 + cam.x, size.h / 2 + cam.y);
    ctx.scale(cam.k, cam.k);
    ctx.translate(-size.w / 2, -size.h / 2);

    const hovered = hoverRef.current != null ? simNodes[hoverRef.current] : null;
    const connected = hovered ? adjacency.get(hovered.id) ?? new Set() : null;
    const now = Date.now();
    const crumbs = getBreadcrumbs();
    const crumbSet = new Map<string, number>();
    for (const c of crumbs) crumbSet.set(c.edge, 1 - (now - c.t) / BREADCRUMB_DECAY_MS);
    timeRef.current += 0.016;

    // edges
    ctx.lineCap = 'round';
    for (const link of simLinks) {
      const s = link.source as SimNode;
      const t = link.target as SimNode;
      if (typeof s !== 'object' || typeof t !== 'object') continue;
      const sx = s.x ?? 0;
      const sy = s.y ?? 0;
      const tx = t.x ?? 0;
      const ty = t.y ?? 0;

      let highlight = false;
      if (hovered && (s.id === hovered.id || t.id === hovered.id)) highlight = true;

      const edgeKey = [s.id, t.id].sort().join('::');
      const crumbStrength = crumbSet.get(edgeKey) ?? 0;

      if (highlight) {
        const cfg = CATEGORY_CONFIG[hovered!.category];
        ctx.strokeStyle = cfg.primary;
        ctx.globalAlpha = 0.9;
        ctx.lineWidth = 2 / cam.k;
      } else if (crumbStrength > 0) {
        ctx.strokeStyle = CATEGORY_CONFIG[s.category].primary;
        ctx.globalAlpha = 0.3 + crumbStrength * 0.5;
        ctx.lineWidth = (1.5 + crumbStrength) / cam.k;
        ctx.shadowColor = CATEGORY_CONFIG[s.category].primary;
        ctx.shadowBlur = 8 * crumbStrength;
      } else if (hovered) {
        ctx.strokeStyle = '#2a2e36';
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 1 / cam.k;
      } else {
        ctx.strokeStyle = '#3a414b';
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 1 / cam.k;
      }

      const mx = (sx + tx) / 2;
      const my = (sy + ty) / 2;
      const dx = tx - sx;
      const dy = ty - sy;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len;
      const ny = dx / len;
      const bow = Math.min(20, len * 0.08);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo(mx + nx * bow, my + ny * bow, tx, ty);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;

    // nodes
    for (let i = 0; i < simNodes.length; i++) {
      const n = simNodes[i];
      const cfg = CATEGORY_CONFIG[n.category];
      const isHover = hovered && hovered.id === n.id;
      const isConn = connected?.has(n.id);
      const desat = hovered && !isHover && !isConn ? 0.4 : ageSaturation(n.age_days);

      let x = n.x ?? 0;
      let y = n.y ?? 0;

      if (hovered && isConn) {
        x += (hovered.x! - x) * CONNECTED_LEAN;
        y += (hovered.y! - y) * CONNECTED_LEAN;
      }
      if (isHover) y -= HOVER_LIFT;

      const breath = prefersReducedMotion() ? 1 : breathScale(n.age_days, timeRef.current);
      const r = n.radius * (isHover ? 1.14 : breath);

      // glow for hovered
      if (isHover) {
        ctx.save();
        ctx.shadowColor = cfg.primary;
        ctx.shadowBlur = 24;
        drawNodeShape(ctx, cfg.shape, x, y, r);
        ctx.fillStyle = cfg.primary;
        ctx.fill();
        ctx.restore();
      } else {
        drawNodeShape(ctx, cfg.shape, x, y, r);
        ctx.fillStyle = desaturate(cfg.primary, desat);
        ctx.fill();
      }

      // private dot ring
      if (n.visibility === 'private') {
        ctx.lineWidth = 1 / cam.k;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        drawNodeShape(ctx, cfg.shape, x, y, r + 3);
        ctx.stroke();
      }

      // label on hover only
      if (isHover) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        if (n.visibility === 'private') {
          ctx.fillStyle = '#8b93a1';
          ctx.font = `500 ${12 / cam.k}px ui-monospace, "JetBrains Mono", monospace`;
          ctx.fillText('🔒 private', x, y + r + 10 / cam.k);
        } else {
          ctx.fillStyle = '#e5e7eb';
          ctx.font = `500 ${13 / cam.k}px ui-monospace, "JetBrains Mono", monospace`;
          const tokens = wrapLabel(n.title, 26);
          for (let li = 0; li < tokens.length; li++) {
            ctx.fillText(tokens[li], x, y + r + 10 / cam.k + (li * 16) / cam.k);
          }
        }
        ctx.restore();
      }
    }

    ctx.restore();
  };

  // Physics — ticks drive render
  const { reheat } = useGraphPhysics(simNodes, simLinks, size.w, size.h, () => {
    renderRef.current();
  });

  // Resize canvas backing store for HiDPI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w || !size.h) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    renderRef.current();
  }, [size]);

  // Reheat on size change
  useEffect(() => {
    reheat(0.4);
  }, [size, reheat]);

  // Idle camera drift
  useEffect(() => {
    if (prefersReducedMotion()) return;
    if (!simNodes.length) return;
    let raf = 0;
    let running = true;
    const tick = (t: number) => {
      if (!running) return;
      const idle = t - lastInteractionRef.current > IDLE_MS;
      if (idle) {
        driftAngleRef.current += 0.002;
        const r = 12;
        cameraRef.current.x += Math.cos(driftAngleRef.current) * 0.25;
        cameraRef.current.y += Math.sin(driftAngleRef.current * 0.7) * 0.18;
        // clamp softly
        cameraRef.current.x = clamp(cameraRef.current.x, -r * 8, r * 8);
        cameraRef.current.y = clamp(cameraRef.current.y, -r * 8, r * 8);
        renderRef.current();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, [simNodes.length]);

  // Convert screen coords → world coords
  const toWorld = (sx: number, sy: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const lx = sx - rect.left;
    const ly = sy - rect.top;
    const cam = cameraRef.current;
    const x = (lx - size.w / 2 - cam.x) / cam.k + size.w / 2;
    const y = (ly - size.h / 2 - cam.y) / cam.k + size.h / 2;
    return { x, y };
  };

  const findNodeAt = (wx: number, wy: number): number | null => {
    for (let i = simNodes.length - 1; i >= 0; i--) {
      const n = simNodes[i];
      const dx = wx - (n.x ?? 0);
      const dy = wy - (n.y ?? 0);
      if (dx * dx + dy * dy <= (n.radius + 6) * (n.radius + 6)) return i;
    }
    return null;
  };

  const navigateToNode = (node: SimNode, event?: MouseEvent | PointerEvent) => {
    if (node.visibility === 'private') return; // private nodes are teasers only

    // record breadcrumb from any previously hovered node
    if (hoverRef.current != null) {
      const from = simNodes[hoverRef.current];
      if (from && from.id !== node.id) addBreadcrumb(from.id, node.id);
    }

    const href = `/posts/${node.id}`;
    const vt = (document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    }).startViewTransition;

    // set a view-transition-name on a temporary overlay covering the clicked node's screen rect
    if (vt && !prefersReducedMotion() && event && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const cam = cameraRef.current;
      const nx = (node.x ?? 0);
      const ny = (node.y ?? 0);
      const sx = rect.left + (nx - size.w / 2) * cam.k + size.w / 2 + cam.x;
      const sy = rect.top + (ny - size.h / 2) * cam.k + size.h / 2 + cam.y;
      const r = node.radius * cam.k * 1.2;

      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        left: ${sx - r}px;
        top: ${sy - r}px;
        width: ${r * 2}px;
        height: ${r * 2}px;
        border-radius: 50%;
        background: ${CATEGORY_CONFIG[node.category].primary};
        view-transition-name: graph-node;
        z-index: 9999;
        pointer-events: none;
      `;
      document.body.appendChild(overlay);

      vt.call(document, () => {
        window.location.href = href;
      });
    } else {
      window.location.href = href;
    }
  };

  // Pointer handlers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      lastInteractionRef.current = performance.now();
      const { x, y } = toWorld(e.clientX, e.clientY);
      const idx = findNodeAt(x, y);
      dragRef.current = {
        active: true,
        moved: false,
        startX: e.clientX,
        startY: e.clientY,
        camStartX: cameraRef.current.x,
        camStartY: cameraRef.current.y,
      };
      if (idx != null) {
        hoverRef.current = idx;
        renderRef.current();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      lastInteractionRef.current = performance.now();
      const drag = dragRef.current;
      if (drag?.active) {
        const dx = e.clientX - drag.startX;
        const dy = e.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) > DRAG_THRESHOLD) drag.moved = true;
        if (drag.moved) {
          cameraRef.current.x = drag.camStartX + dx;
          cameraRef.current.y = drag.camStartY + dy;
          renderRef.current();
        }
      } else {
        const { x, y } = toWorld(e.clientX, e.clientY);
        const idx = findNodeAt(x, y);
        const prev = hoverRef.current;
        hoverRef.current = idx;
        if (prev !== idx) {
          canvas.style.cursor = idx != null ? 'pointer' : 'grab';
          renderRef.current();
        }
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      lastInteractionRef.current = performance.now();
      const drag = dragRef.current;
      dragRef.current = null;
      if (drag && !drag.moved) {
        const { x, y } = toWorld(e.clientX, e.clientY);
        const idx = findNodeAt(x, y);
        if (idx != null) {
          navigateToNode(simNodes[idx], e);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      lastInteractionRef.current = performance.now();
      const factor = Math.exp(-e.deltaY * 0.0015);
      const cam = cameraRef.current;
      const nextK = clamp(cam.k * factor, 0.4, 3.0);
      // zoom around cursor
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      // translate so the world point under the cursor stays put
      cam.x = cx - size.w / 2 - (cx - size.w / 2 - cam.x) * (nextK / cam.k);
      cam.y = cy - size.h / 2 - (cy - size.h / 2 - cam.y) * (nextK / cam.k);
      cam.k = nextK;
      renderRef.current();
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.style.cursor = 'grab';

    return () => {
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [simNodes, size.w, size.h]);

  return (
    <div ref={containerRef} className="graph-root" aria-hidden="true">
      <canvas ref={canvasRef} className="graph-canvas" />
      {status === 'loading' && <div className="graph-loading">mapping the graph…</div>}
      {status === 'error' && <div className="graph-loading">could not load graph.</div>}
    </div>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function wrapLabel(s: string, maxChars: number): string[] {
  if (s.length <= maxChars) return [s];
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function desaturate(hex: string, amount: number): string {
  // hex #rrggbb → mix toward gray by (1 - amount)
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const gray = r * 0.3 + g * 0.59 + b * 0.11;
  const nr = Math.round(r * amount + gray * (1 - amount));
  const ng = Math.round(g * amount + gray * (1 - amount));
  const nb = Math.round(b * amount + gray * (1 - amount));
  return `rgb(${nr}, ${ng}, ${nb})`;
}
