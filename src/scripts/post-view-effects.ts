import { CATEGORY_CONFIG, type Category } from '@lib/categories';

const KEY_PREFIX = 'idks_visited_';
const slug = window.location.pathname.replace(/^\/posts\//, '').replace(/\/$/, '');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function safeGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // no-op
  }
}

function safeRemove(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // no-op
  }
}

// Arriving rivers overlay — when we came here via a cross-category link,
// the destination shows a translucent two-rivers gradient (origin -> destination)
// that lingers for ~2.5s then fades out.
(() => {
  if (reducedMotion) return;

  const raw = safeGet('idks_origin');
  if (!raw) return;
  safeRemove('idks_origin');

  try {
    const origin = JSON.parse(raw) as {
      fromSlug: string;
      fromCat: Category;
      toSlug: string;
      toCat: Category;
      ts: number;
    };
    if (origin.toSlug !== slug) return;
    if (Date.now() - origin.ts > 8000) return;

    const from = CATEGORY_CONFIG[origin.fromCat]?.primary;
    const to = CATEGORY_CONFIG[origin.toCat]?.primary;
    if (!from || !to) return;

    const overlay = document.createElement('div');
    overlay.className = 'arriving-rivers';
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2; pointer-events: none; opacity: 0;
      background:
        linear-gradient(115deg,
          ${from}55 0%,
          ${from}22 22%,
          transparent 42%,
          transparent 58%,
          ${to}22 78%,
          ${to}55 100%),
        radial-gradient(ellipse 60% 40% at 15% 30%, ${from}33, transparent 70%),
        radial-gradient(ellipse 60% 40% at 85% 70%, ${to}33, transparent 70%);
    `;
    document.body.appendChild(overlay);

    overlay.animate(
      [
        { opacity: 0 },
        { opacity: 1, offset: 0.12 },
        { opacity: 0.9, offset: 0.55 },
        { opacity: 0 },
      ],
      { duration: 2600, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' },
    ).onfinish = () => overlay.remove();
  } catch {
    // no-op
  }
})();

const visited = safeGet(KEY_PREFIX + slug);
if (!visited && !reducedMotion) {
  safeSet(KEY_PREFIX + slug, '1');
  const titleEl = document.querySelector('.post-title');
  if (titleEl) {
    const full = titleEl.textContent || '';
    titleEl.textContent = '';
    let i = 0;
    const tick = () => {
      if (i <= full.length) {
        titleEl.textContent = full.slice(0, i) + (i < full.length ? '▌' : '');
        i++;
        requestAnimationFrame(() => setTimeout(tick, 28 + Math.random() * 22));
      } else {
        titleEl.textContent = full;
        queueRipple();
      }
    };
    tick();
  } else {
    queueRipple();
  }
}

// You-are-here ripple — single concentric pulse from the post hero's center
// using the current theme color. Plays once, right after the title finishes typing.
function queueRipple() {
  const theme = document.documentElement.dataset.theme as Category | undefined;
  if (!theme) return;
  const color = CATEGORY_CONFIG[theme]?.primary;
  if (!color) return;

  const header = document.querySelector('.post-header') as HTMLElement | null;
  const rect = header?.getBoundingClientRect();
  const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
  const cy = rect ? rect.top + 40 : window.innerHeight / 3;

  for (let i = 0; i < 2; i++) {
    const r = document.createElement('div');
    r.style.cssText = `
      position: fixed; left: ${cx}px; top: ${cy}px;
      width: 20px; height: 20px; margin: -10px 0 0 -10px;
      border: 2px solid ${color}; border-radius: 50%;
      pointer-events: none; z-index: 3; opacity: 0;
    `;
    document.body.appendChild(r);
    r.animate(
      [
        { transform: 'scale(0.4)', opacity: 0.9 },
        { transform: 'scale(14)', opacity: 0 },
      ],
      {
        duration: 1400 + i * 200,
        delay: i * 180,
        easing: 'cubic-bezier(0.22,1,0.36,1)',
        fill: 'forwards',
      },
    ).onfinish = () => r.remove();
  }
}
