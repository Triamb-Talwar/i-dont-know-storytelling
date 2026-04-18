import { useEffect, useRef, useState } from 'react';

interface AsciiPayload {
  name: string;
  cols: number;
  rows: number;
  frames: number;
  fg: string;
  data: string[];
}

interface Props {
  name: string;
  align?: 'left' | 'center' | 'right';
  size?: number; // CSS font-size in rem; default 0.75
  label?: string; // optional aria-label
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default function AsciiCanvas({ name, align = 'center', size = 0.75, label }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
  const [payload, setPayload] = useState<AsciiPayload | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  // Fetch frame data
  useEffect(() => {
    let alive = true;
    fetch(`/ascii/${name}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<AsciiPayload>;
      })
      .then((data) => {
        if (!alive) return;
        setPayload(data);
        setStatus('ready');
      })
      .catch(() => {
        if (alive) setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [name]);

  // Scroll-driven frame playback
  useEffect(() => {
    if (!payload) return;
    const wrap = wrapRef.current;
    const pre = preRef.current;
    if (!wrap || !pre) return;

    const reduced = prefersReducedMotion();
    if (reduced) {
      // show last frame statically; no rAF loop
      pre.textContent = payload.data[payload.data.length - 1];
      return;
    }

    let visible = false;
    let raf = 0;
    let lastFrame = -1;

    const update = () => {
      const rect = wrap.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      // Map scroll position to [0,1].
      // progress = 0 when element's top is at viewport bottom (just entering)
      // progress = 1 when element's bottom has scrolled past viewport top (just left)
      const total = vh + rect.height;
      const traveled = vh - rect.top;
      let t = traveled / total;
      if (t < 0) t = 0;
      else if (t > 1) t = 1;
      const idx = Math.min(payload.data.length - 1, Math.max(0, Math.floor(t * payload.data.length)));
      if (idx !== lastFrame) {
        pre.textContent = payload.data[idx];
        lastFrame = idx;
      }
    };

    const onTick = () => {
      update();
      raf = visible ? requestAnimationFrame(onTick) : 0;
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            if (!visible) {
              visible = true;
              onTick();
            }
          } else {
            visible = false;
            if (raf) {
              cancelAnimationFrame(raf);
              raf = 0;
            }
          }
        }
      },
      { rootMargin: '120px 0px 120px 0px' },
    );
    io.observe(wrap);
    // initial render so it isn't blank before first intersection
    update();

    return () => {
      io.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [payload]);

  return (
    <div
      ref={wrapRef}
      className={`ascii-wrap ascii-${align}`}
      style={{
        ['--ascii-fg' as string]: payload?.fg ?? 'currentColor',
        ['--ascii-size' as string]: `${size}rem`,
      }}
      role="img"
      aria-label={label ?? `ascii animation: ${name}`}
    >
      {status === 'error' ? (
        <pre className="ascii-pre" aria-hidden="true">
          {`[ascii: ${name} unavailable]`}
        </pre>
      ) : (
        <pre ref={preRef} className="ascii-pre" aria-hidden="true" />
      )}
    </div>
  );
}
