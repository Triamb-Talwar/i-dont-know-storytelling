import { describe, it, expect } from 'vitest';
import { pickPersonalVariants } from './personal';
import { hashSlug } from '../seed';

describe('pickPersonalVariants', () => {
  it('is deterministic for the same seed', () => {
    const a = pickPersonalVariants(42);
    const b = pickPersonalVariants(42);
    expect(a).toEqual(b);
  });

  it('returns different variants for different seeds (sampled)', () => {
    const a = pickPersonalVariants(1);
    const b = pickPersonalVariants(10_000);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('returned values stay inside the declared banks', () => {
    const fonts = new Set(['playfair', 'cormorant', 'bodoni']);

    for (let i = 0; i < 200; i++) {
      const v = pickPersonalVariants(hashSlug(`post-${i}`));
      expect(fonts.has(v.dropCapFont)).toBe(true);
      expect(v.inkBlotX).toBeGreaterThanOrEqual(15);
      expect(v.inkBlotX).toBeLessThanOrEqual(85);
      expect(v.inkBlotY).toBeGreaterThanOrEqual(20);
      expect(v.inkBlotY).toBeLessThanOrEqual(80);
      expect(v.inkBlotRot).toBeGreaterThanOrEqual(0);
      expect(v.inkBlotRot).toBeLessThanOrEqual(359);
      expect(v.inkBlotOpacity).toBeGreaterThanOrEqual(0.1);
      expect(v.inkBlotOpacity).toBeLessThanOrEqual(0.22);
      expect(Math.abs(v.marginaliaRot)).toBeGreaterThanOrEqual(2);
      expect(Math.abs(v.marginaliaRot)).toBeLessThanOrEqual(8);
      expect(v.underlineRoughness).toBeGreaterThanOrEqual(0.5);
      expect(v.underlineRoughness).toBeLessThanOrEqual(1.5);
    }
  });

  it('distribution: dropCapFont stays within 5-60% across 100 samples', () => {
    const counts: Record<string, number> = {};
    const N = 100;
    for (let i = 0; i < N; i++) {
      const v = pickPersonalVariants(hashSlug(`post-${i}-${String.fromCharCode(65 + (i % 26))}`));
      counts[v.dropCapFont] = (counts[v.dropCapFont] ?? 0) + 1;
    }
    for (const [variant, count] of Object.entries(counts)) {
      const pct = count / N;
      expect(pct, `dropCapFont=${variant} is ${(pct * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(0.05);
      expect(pct, `dropCapFont=${variant} is ${(pct * 100).toFixed(1)}%`).toBeLessThanOrEqual(0.6);
    }
  });

  it('marginaliaRot is signed (tilts both ways across slugs)', () => {
    let hasPositive = false;
    let hasNegative = false;
    for (let i = 0; i < 100; i++) {
      const v = pickPersonalVariants(hashSlug(`post-${i}`));
      if (v.marginaliaRot > 0) hasPositive = true;
      if (v.marginaliaRot < 0) hasNegative = true;
    }
    expect(hasPositive).toBe(true);
    expect(hasNegative).toBe(true);
  });
});
