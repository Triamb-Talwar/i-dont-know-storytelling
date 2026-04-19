import { describe, it, expect } from 'vitest';
import { pickMediaVariants } from './media';
import { hashSlug } from '../seed';

describe('pickMediaVariants', () => {
  it('is deterministic for the same seed', () => {
    const a = pickMediaVariants(42);
    const b = pickMediaVariants(42);
    expect(a).toEqual(b);
  });

  it('returns different variants for different seeds (sampled)', () => {
    const a = pickMediaVariants(1);
    const b = pickMediaVariants(10_000);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('returned values stay inside the declared banks', () => {
    const tints = new Set(['warm', 'cool', 'neutral']);

    for (let i = 0; i < 200; i++) {
      const v = pickMediaVariants(hashSlug(`post-${i}`));
      expect(tints.has(v.filmTint)).toBe(true);
      expect(v.countdownNum).toBeGreaterThanOrEqual(1);
      expect(v.countdownNum).toBeLessThanOrEqual(9);
      expect(v.timestampLabel).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    }
  });

  it('distribution: filmTint stays within 5-60% across 100 samples', () => {
    const counts: Record<string, number> = {};
    const N = 100;
    for (let i = 0; i < N; i++) {
      const v = pickMediaVariants(hashSlug(`post-${i}-${String.fromCharCode(65 + (i % 26))}`));
      counts[v.filmTint] = (counts[v.filmTint] ?? 0) + 1;
    }
    for (const [variant, count] of Object.entries(counts)) {
      const pct = count / N;
      expect(pct, `filmTint=${variant} is ${(pct * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(0.05);
      expect(pct, `filmTint=${variant} is ${(pct * 100).toFixed(1)}%`).toBeLessThanOrEqual(0.6);
    }
  });
});
