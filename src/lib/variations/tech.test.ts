import { describe, it, expect } from 'vitest';
import { pickTechVariants } from './tech';
import { hashSlug } from '../seed';

describe('pickTechVariants', () => {
  it('is deterministic for the same seed', () => {
    const a = pickTechVariants(42);
    const b = pickTechVariants(42);
    expect(a).toEqual(b);
  });

  it('returns different variants for different seeds (sampled)', () => {
    const a = pickTechVariants(1);
    const b = pickTechVariants(10_000);
    expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
  });

  it('returned values stay inside the declared banks', () => {
    const prompts = new Set(['$', '>', '#', '~', '\u276F']);
    const bullets = new Set(['\u2022', '\u25B8', '\u25AA', '\u25E6', '\u203A', '\u25AB']);
    const gaps = new Set([1, 2, 3]);
    const labels = new Set(['CTRL+C', 'ESC', '^Z', 'TAB']);
    const corners = new Set(['tl', 'tr', 'bl', 'br']);

    for (let i = 0; i < 200; i++) {
      const v = pickTechVariants(hashSlug(`post-${i}`));
      expect(prompts.has(v.promptChar)).toBe(true);
      expect(bullets.has(v.bulletGlyph)).toBe(true);
      expect(gaps.has(v.scanlineGap)).toBe(true);
      expect(labels.has(v.watermarkLabel)).toBe(true);
      expect(corners.has(v.watermarkCorner)).toBe(true);
    }
  });

  it('distribution: no variant is picked <5% or >60% across 100 samples', () => {
    const counts: Record<string, Record<string, number>> = {
      promptChar: {},
      bulletGlyph: {},
      scanlineGap: {},
      watermarkLabel: {},
      watermarkCorner: {},
    };
    const N = 100;
    for (let i = 0; i < N; i++) {
      const v = pickTechVariants(hashSlug(`post-${i}-${String.fromCharCode(65 + (i % 26))}`));
      counts.promptChar[v.promptChar] = (counts.promptChar[v.promptChar] ?? 0) + 1;
      counts.bulletGlyph[v.bulletGlyph] = (counts.bulletGlyph[v.bulletGlyph] ?? 0) + 1;
      counts.scanlineGap[String(v.scanlineGap)] = (counts.scanlineGap[String(v.scanlineGap)] ?? 0) + 1;
      counts.watermarkLabel[v.watermarkLabel] = (counts.watermarkLabel[v.watermarkLabel] ?? 0) + 1;
      counts.watermarkCorner[v.watermarkCorner] = (counts.watermarkCorner[v.watermarkCorner] ?? 0) + 1;
    }

    for (const dim of Object.keys(counts)) {
      for (const [variant, count] of Object.entries(counts[dim])) {
        const pct = count / N;
        expect(pct, `${dim}=${variant} is ${(pct * 100).toFixed(1)}%`).toBeGreaterThanOrEqual(0.05);
        expect(pct, `${dim}=${variant} is ${(pct * 100).toFixed(1)}%`).toBeLessThanOrEqual(0.6);
      }
    }
  });
});
