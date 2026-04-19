import { useEffect, useRef } from 'react';

interface Props {
  /** Seeded roughness passed through from the post slug. */
  roughness: number;
  /** Seed used for rough.js's own jitter so the underline is deterministic. */
  seed: number;
}

/**
 * Hand-drawn link underlines for .post-body a. Mounts once per post on
 * `client:visible` so rough.js (~9kB gzip) is only pulled in for personal
 * posts, and only once the post body enters the viewport. This is the
 * rough.js island the design docs describe — NOT wrapped around every
 * link individually.
 */
export default function RoughUnderlines({ roughness, seed }: Props) {
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = marker.current?.closest('.post-body');
    if (!host) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    let ro: ResizeObserver | null = null;

    (async () => {
      const rough = (await import('roughjs/bin/rough')).default;
      if (cancelled) return;

      const links = Array.from(host.querySelectorAll<HTMLAnchorElement>('a'));
      if (links.length === 0) return;

      const overlays = new WeakMap<HTMLAnchorElement, SVGSVGElement>();

      const redraw = () => {
        for (const a of links) {
          let svg = overlays.get(a);
          const rect = a.getBoundingClientRect();
          const width = Math.ceil(rect.width);
          if (width < 4) continue;
          const height = 10;

          if (!svg) {
            svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('aria-hidden', 'true');
            svg.style.cssText =
              'position:absolute;left:0;right:0;bottom:-6px;width:100%;height:10px;overflow:visible;pointer-events:none;';
            a.style.position = a.style.position || 'relative';
            a.appendChild(svg);
            overlays.set(a, svg);
          }

          svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
          svg.setAttribute('width', String(width));
          svg.setAttribute('height', String(height));
          while (svg.firstChild) svg.removeChild(svg.firstChild);

          const rc = rough.svg(svg, {
            options: {
              roughness,
              bowing: 1.6,
              stroke: 'currentColor',
              strokeWidth: 1.3,
              seed: seed & 0xffffffff,
            },
          });
          const node = rc.line(2, 4, width - 2, 4);
          svg.appendChild(node);
        }
      };

      redraw();

      // Re-draw on resize (reflow breaks pre-computed line lengths).
      ro = new ResizeObserver(redraw);
      ro.observe(host);
    })();

    return () => {
      cancelled = true;
      ro?.disconnect();
    };
  }, [roughness, seed]);

  // Zero-visual marker element so React has an anchor node inside the
  // post tree. All real DOM mutations happen against link children.
  return <span ref={marker} aria-hidden="true" style={{ display: 'none' }} />;
}
