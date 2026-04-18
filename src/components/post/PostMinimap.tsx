import { useEffect, useRef, useState } from 'react';
import { CATEGORY_CONFIG, type Category } from '@lib/categories';

interface MinimapNode {
  id: string;
  title: string;
  category: Category;
  visibility: 'public' | 'private';
  tags: string[];
}
interface MinimapEdge {
  source: string;
  target: string;
}

interface Props {
  currentSlug: string;
}

function hashSlug(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h >>> 0) / 4294967295;
}

export default function PostMinimap({ currentSlug }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nodes, setNodes] = useState<MinimapNode[]>([]);
  const [edges, setEdges] = useState<MinimapEdge[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    fetch('/graph.json')
      .then((r) => r.json())
      .then((d: { nodes: MinimapNode[]; edges: MinimapEdge[] }) => {
        setNodes(d.nodes);
        setEdges(d.edges);
      })
      .catch(() => {});
  }, []);

  // Tag-hover binding: listen to .tag-link mouseenter/leave in post header.
  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.post-header .tag-link'));
    const onEnter = (e: Event) => {
      const tag = (e.currentTarget as HTMLElement).dataset.tag;
      if (tag) setActiveTag(tag);
    };
    const onLeave = () => setActiveTag(null);
    links.forEach((a) => {
      a.addEventListener('mouseenter', onEnter);
      a.addEventListener('focus', onEnter);
      a.addEventListener('mouseleave', onLeave);
      a.addEventListener('blur', onLeave);
    });
    return () => {
      links.forEach((a) => {
        a.removeEventListener('mouseenter', onEnter);
        a.removeEventListener('focus', onEnter);
        a.removeEventListener('mouseleave', onLeave);
        a.removeEventListener('blur', onLeave);
      });
    };
  }, [nodes.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !nodes.length) return;
    const W = 180;
    const H = 180;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const sorted = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
    const cx = W / 2;
    const cy = H / 2;
    const r = Math.min(W, H) * 0.36;
    const pos = new Map<string, { x: number; y: number }>();
    sorted.forEach((n, i) => {
      const angle = (i / sorted.length) * Math.PI * 2 + hashSlug(n.id) * 0.4;
      const jitter = 0.7 + hashSlug(n.id + 'r') * 0.6;
      pos.set(n.id, {
        x: cx + Math.cos(angle) * r * jitter,
        y: cy + Math.sin(angle) * r * jitter,
      });
    });

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let raf = 0;
    const draw = () => {
      tRef.current += 0.03;
      ctx.clearRect(0, 0, W, H);

      // edges
      ctx.lineWidth = 0.6;
      edges.forEach((e) => {
        const a = pos.get(e.source);
        const b = pos.get(e.target);
        if (!a || !b) return;
        const involvesCurrent = e.source === currentSlug || e.target === currentSlug;
        ctx.strokeStyle = involvesCurrent ? '#6a737d' : '#2a2e36';
        ctx.globalAlpha = involvesCurrent ? 0.9 : 0.5;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;

      // nodes
      nodes.forEach((n) => {
        const p = pos.get(n.id);
        if (!p) return;
        const cfg = CATEGORY_CONFIG[n.category];
        const isCurrent = n.id === currentSlug;
        const tagMatch = activeTag && n.tags.includes(activeTag);
        const isPrivate = n.visibility === 'private';

        let radius = isPrivate ? 1.4 : isCurrent ? 5 : 2.6;
        if (tagMatch && !reduced) {
          radius += 1.5 + Math.sin(tRef.current * 4) * 0.8;
        }

        ctx.fillStyle = cfg.primary;
        ctx.globalAlpha = isPrivate ? 0.45 : tagMatch || isCurrent ? 1 : 0.75;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();

        if (isCurrent) {
          const pulse = reduced ? 0 : (Math.sin(tRef.current * 2) + 1) / 2;
          ctx.globalAlpha = 0.4 + pulse * 0.4;
          ctx.lineWidth = 1;
          ctx.strokeStyle = cfg.primary;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius + 3 + pulse * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      if (!reduced) raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [nodes, edges, activeTag, currentSlug]);

  return (
    <aside
      className="post-minimap"
      aria-label="you are here — graph context"
      style={{
        contentVisibility: 'auto',
      }}
    >
      <a href="/" aria-label="back to full graph">
        <canvas ref={canvasRef} />
      </a>
    </aside>
  );
}
