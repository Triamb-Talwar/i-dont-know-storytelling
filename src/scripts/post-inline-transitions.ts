import { CATEGORY_CONFIG, type Category } from '@lib/categories';

const currentTheme = document.documentElement.dataset.theme as Category | undefined;
if (currentTheme) {
  initInlinePostTransitions(currentTheme);
}

function initInlinePostTransitions(theme: Category) {
  const currentSlug = window.location.pathname.replace(/^\/posts\//, '').replace(/\/$/, '');
  const slugMap = readSlugCategoryMap();
  const postBody = document.querySelector('.post-body') as HTMLElement | null;
  if (!postBody) return;

  postBody.addEventListener('click', async (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    const a = target?.closest('a') as HTMLAnchorElement | null;
    if (!a) return;
    if (!shouldInterceptLinkClick(e, a)) return;

    const slug = resolveSlug(a.getAttribute('href') ?? '');
    if (!slug) return;

    const targetCat = slugMap[slug];
    if (!targetCat) return;
    if (slug === currentSlug) return;

    e.preventDefault();
    const dest = `/posts/${slug}/`;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (targetCat !== theme) {
      try {
        sessionStorage.setItem(
          'idks_origin',
          JSON.stringify({
            fromSlug: currentSlug,
            fromCat: theme,
            toSlug: slug,
            toCat: targetCat,
            ts: Date.now(),
          }),
        );
      } catch {
        // no-op
      }
    }

    if (reduced) {
      window.location.href = dest;
      return;
    }

    await runGraphTransition(currentSlug, slug, targetCat, theme, slugMap);
    window.location.href = dest;
  });
}

function readSlugCategoryMap(): Record<string, Category> {
  const host = document.getElementById('slug-categories-data');
  const encoded = host?.getAttribute('data-map');
  if (!encoded) return {};
  try {
    return JSON.parse(decodeURIComponent(encoded)) as Record<string, Category>;
  } catch {
    return {};
  }
}

function shouldInterceptLinkClick(e: MouseEvent, a: HTMLAnchorElement): boolean {
  if (e.defaultPrevented) return false;
  if (e.button !== 0) return false;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  if (a.target && a.target !== '_self') return false;
  if (a.hasAttribute('download')) return false;
  return true;
}

function resolveSlug(href: string): string | null {
  if (!href) return null;
  try {
    const url = new URL(href, window.location.href);
    if (url.origin !== window.location.origin) return null;
    const match = url.pathname.match(/^\/posts\/([^/]+)\/?$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

interface NodePos {
  slug: string;
  cat: Category;
  x: number;
  y: number;
}

function hashSlug(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function computeLayout(slugMap: Record<string, Category>, w: number, h: number): NodePos[] {
  const slugs = Object.keys(slugMap).sort();
  const cx = w / 2;
  const cy = h / 2;
  const r = Math.min(w, h) * 0.32;
  return slugs.map((slug, i) => {
    const angle = (i / slugs.length) * Math.PI * 2 + hashSlug(slug) * 0.4;
    const jitter = 0.75 + hashSlug(slug + 'r') * 0.5;
    return {
      slug,
      cat: slugMap[slug],
      x: cx + Math.cos(angle) * r * jitter,
      y: cy + Math.sin(angle) * r * jitter,
    };
  });
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

async function runGraphTransition(
  fromSlug: string,
  toSlug: string,
  toCat: Category,
  currentTheme: Category,
  slugMap: Record<string, Category>,
) {
  const article = document.querySelector('.post-main') as HTMLElement | null;
  const w = window.innerWidth;
  const h = window.innerHeight;

  if (article) {
    article.animate(
      [
        { opacity: 1, transform: 'scale(1)', filter: 'blur(0px)' },
        { opacity: 0, transform: 'scale(0.92)', filter: 'blur(6px)' },
      ],
      { duration: 360, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
    );
  }

  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9998; pointer-events: none;
    background: ${CATEGORY_CONFIG[currentTheme].background};
    opacity: 0;
  `;
  document.body.appendChild(overlay);
  overlay.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, fill: 'forwards' });

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  const cleanup = () => {
    overlay.remove();
    canvas.remove();
  };

  const nodes = computeLayout(slugMap, w, h);
  const from = nodes.find((n) => n.slug === fromSlug);
  const to = nodes.find((n) => n.slug === toSlug);
  if (!from || !to) {
    cleanup();
    return;
  }

  // Visual-only edge scaffold for the transition fly-through.
  const edges: Array<[number, number]> = [];
  nodes.forEach((n, i) => {
    const nearest = nodes
      .map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) }))
      .filter((o) => o.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    nearest.forEach((o) => {
      if (i < o.j) edges.push([i, o.j]);
    });
  });

  const duration = 1500;
  const start = performance.now();

  await new Promise<void>((resolve) => {
    const frame = (now: number) => {
      const t = Math.min(1, (now - start) / duration);

      let camX: number;
      let camY: number;
      let scale: number;
      if (t < 0.22) {
        const k = easeOutCubic(t / 0.22);
        camX = from.x;
        camY = from.y;
        scale = 3.2 - 0.2 * k;
      } else if (t < 0.55) {
        const k = easeInOutCubic((t - 0.22) / 0.33);
        camX = from.x + (w / 2 - from.x) * k;
        camY = from.y + (h / 2 - from.y) * k;
        scale = 3.0 + (1.0 - 3.0) * k;
      } else if (t < 0.8) {
        const k = easeInOutCubic((t - 0.55) / 0.25);
        camX = w / 2 + (to.x - w / 2) * k;
        camY = h / 2 + (to.y - h / 2) * k;
        scale = 1.0;
      } else {
        const k = easeInOutCubic((t - 0.8) / 0.2);
        camX = to.x;
        camY = to.y;
        scale = 1.0 + (3.4 - 1.0) * k;
      }

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(scale, scale);
      ctx.translate(-camX, -camY);

      ctx.strokeStyle = 'rgba(140,140,140,0.35)';
      ctx.lineWidth = 1 / scale;
      edges.forEach(([i, j]) => {
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      });

      nodes.forEach((n) => {
        const cfg = CATEGORY_CONFIG[n.cat];
        const isFrom = n.slug === fromSlug;
        const isTo = n.slug === toSlug;
        const baseR = isFrom || isTo ? 10 : 6;
        ctx.fillStyle = cfg.primary;
        ctx.globalAlpha = isFrom || isTo ? 1 : 0.75;
        ctx.beginPath();
        ctx.arc(n.x, n.y, baseR, 0, Math.PI * 2);
        ctx.fill();
        if (isTo) {
          const pulse = t > 0.55 ? easeOutCubic((t - 0.55) / 0.45) : 0;
          ctx.globalAlpha = 0.6 * (1 - pulse * 0.3);
          ctx.lineWidth = 2 / scale;
          ctx.strokeStyle = cfg.primary;
          ctx.beginPath();
          ctx.arc(n.x, n.y, baseR + 6 + pulse * 14, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;
      ctx.restore();

      if (t > 0.92) {
        const k = (t - 0.92) / 0.08;
        ctx.fillStyle = CATEGORY_CONFIG[toCat].primary;
        ctx.globalAlpha = k * 0.85;
        ctx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 1;
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        cleanup();
        resolve();
      }
    };
    requestAnimationFrame(frame);
  });
}
