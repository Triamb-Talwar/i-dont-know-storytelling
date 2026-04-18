import { useEffect, useRef } from 'react';

interface Props {
  fromColor: string;
  toColor: string;
  href: string;
  onDone?: () => void;
}

export default function TwoRivers({ fromColor, toColor, href, onDone }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      window.location.href = href;
      return;
    }

    el.offsetHeight; // force reflow

    const anim = el.animate(
      [
        { clipPath: 'inset(0 100% 0 0)', opacity: 0.7 },
        { clipPath: 'inset(0 50% 0 0)', opacity: 1, offset: 0.35 },
        { clipPath: 'inset(0 0 0 0)', opacity: 1 },
      ],
      { duration: 620, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    );

    anim.onfinish = () => {
      window.location.href = href;
      onDone?.();
    };

    return () => anim.cancel();
  }, [href, onDone]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        pointerEvents: 'none',
        background: `linear-gradient(105deg, ${fromColor} 0%, ${fromColor} 45%, ${toColor} 55%, ${toColor} 100%)`,
        clipPath: 'inset(0 100% 0 0)',
        opacity: 0,
      }}
    />
  );
}
