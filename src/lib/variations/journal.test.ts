import { describe, it, expect } from 'vitest';
import { pickJournalVariants } from './journal';
import { hashSlug } from '../seed';

describe('pickJournalVariants', () => {
  it('is deterministic for the same seed', () => {
    const a = pickJournalVariants(42);
    const b = pickJournalVariants(42);
    expect(a).toEqual(b);
  });

  it('returns different variants for different seeds (sampled)', () => {
    const a = pickJournalVariants(1);
    const b = pickJournalVariants(10_000);
    // two distinct seeds should at least not produce identical objects
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('returned values stay inside the declared banks', () => {
    const folds = new Set(['tl', 'tr', 'bl', 'br']);
    const stamps = new Set(['stamp-a', 'stamp-b', 'stamp-c']);
    const sides = new Set(['left', 'right']);

    for (let i = 0; i < 200; i++) {
      const v = pickJournalVariants(hashSlug(`post-${i}`));
      expect(folds.has(v.cornerFold)).toBe(true);
      expect(stamps.has(v.dateStamp)).toBe(true);
      expect(sides.has(v.marginNote)).toBe(true);
      expect(v.coffeeRingX).toBeGreaterThanOrEqual(10);
      expect(v.coffeeRingX).toBeLessThanOrEqual(90);
      expect(v.coffeeRingY).toBeGreaterThanOrEqual(15);
      expect(v.coffeeRingY).toBeLessThanOrEqual(85);
      expect(v.coffeeRingOpacity).toBeGreaterThanOrEqual(0.04);
      expect(v.coffeeRingOpacity).toBeLessThanOrEqual(0.09);
    }
  });

  it('distribution: no variant is picked <5% or >60% across 100 samples', () => {
    const counts: Record<string, Record<string, number>> = {
      cornerFold: {},
      dateStamp: {},
      marginNote: {},
    };
    const N = 100;
    for (let i = 0; i < N; i++) {
      const v = pickJournalVariants(hashSlug(`post-${i}-${String.fromCharCode(65 + (i % 26))}`));
      counts.cornerFold[v.cornerFold] = (counts.cornerFold[v.cornerFold] ?? 0) + 1;
      counts.dateStamp[v.dateStamp] = (counts.dateStamp[v.dateStamp] ?? 0) + 1;
      counts.marginNote[v.marginNote] = (counts.marginNote[v.marginNote] ?? 0) + 1;
    }

    for (const dim of Object.keys(counts)) {
      for (const [variant, count] of Object.entries(counts[dim])) {
        const pct = count / N;
        // margin-note only has 2 buckets, so loosen upper bound to 75%
        const upper = dim === 'marginNote' ? 0.75 : 0.6;
        expect(pct, `${dim}=${variant} is ${(pct * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(0.05);
        expect(pct, `${dim}=${variant} is ${(pct * 100).toFixed(1)}%`).toBeLessThanOrEqual(upper);
      }
    }
  });
});
