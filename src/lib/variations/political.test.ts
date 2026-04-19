import { describe, it, expect } from 'vitest';
import { pickPoliticalVariants } from './political';
import { hashSlug } from '../seed';

describe('pickPoliticalVariants', () => {
  it('is deterministic for the same seed and date', () => {
    const d = new Date(2026, 0, 1);
    const a = pickPoliticalVariants(42, d);
    const b = pickPoliticalVariants(42, d);
    expect(a).toEqual(b);
  });

  it('returns different variants for different seeds (sampled)', () => {
    const a = pickPoliticalVariants(1);
    const b = pickPoliticalVariants(10_000);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('returned values stay inside the declared banks', () => {
    const ornaments = new Set(['\u2726', '\u2766', '\u00A7', '\u00B6', '\u2767', '\u2756', '\u2727']);
    const rules = new Set(['solid', 'dotted', 'double']);

    for (let i = 0; i < 200; i++) {
      const d = new Date(2026, i % 12, 1);
      const v = pickPoliticalVariants(hashSlug(`post-${i}`), d);
      expect(ornaments.has(v.sectionOrnament)).toBe(true);
      expect(rules.has(v.columnRule)).toBe(true);
      expect(v.issueMasthead).toMatch(/Vol\./);
      expect(Math.abs(v.stampRot)).toBeGreaterThanOrEqual(3);
      expect(Math.abs(v.stampRot)).toBeLessThanOrEqual(15);
      expect(v.stampOpacity).toBeGreaterThanOrEqual(0.28);
      expect(v.stampOpacity).toBeLessThanOrEqual(0.42);
    }
  });

  it('distribution: no sectionOrnament or columnRule is picked <5% or >60%', () => {
    const counts: Record<string, Record<string, number>> = { sectionOrnament: {}, columnRule: {} };
    const N = 100;
    for (let i = 0; i < N; i++) {
      const v = pickPoliticalVariants(hashSlug(`post-${i}-${String.fromCharCode(65 + (i % 26))}`));
      counts.sectionOrnament[v.sectionOrnament] = (counts.sectionOrnament[v.sectionOrnament] ?? 0) + 1;
      counts.columnRule[v.columnRule] = (counts.columnRule[v.columnRule] ?? 0) + 1;
    }
    for (const dim of Object.keys(counts)) {
      for (const [variant, count] of Object.entries(counts[dim])) {
        const pct = count / N;
        expect(pct, `${dim}=${variant} is ${(pct * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(0.05);
        expect(pct, `${dim}=${variant} is ${(pct * 100).toFixed(1)}%`).toBeLessThanOrEqual(0.6);
      }
    }
  });

  it('stampRot is signed (leans both ways)', () => {
    let pos = false;
    let neg = false;
    for (let i = 0; i < 100; i++) {
      const v = pickPoliticalVariants(hashSlug(`post-${i}`));
      if (v.stampRot > 0) pos = true;
      if (v.stampRot < 0) neg = true;
    }
    expect(pos).toBe(true);
    expect(neg).toBe(true);
  });
});
