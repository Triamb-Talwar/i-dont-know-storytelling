import { getRng, pick } from '../seed';

export interface TechVariants {
  /** Shell-ish prompt glyph in front of the post title. */
  promptChar: '$' | '>' | '#' | '~' | '\u276F';
  /** Unicode bullet used for unordered list markers. */
  bulletGlyph: '\u2022' | '\u25B8' | '\u25AA' | '\u25E6' | '\u203A' | '\u25AB';
  /** Space between diagonal scanlines, in px. */
  scanlineGap: 1 | 2 | 3;
  /** Corner watermark label. */
  watermarkLabel: 'CTRL+C' | 'ESC' | '^Z' | 'TAB';
  /** Which corner the watermark sits in. */
  watermarkCorner: 'tl' | 'tr' | 'bl' | 'br';
}

export function pickTechVariants(seed: number): TechVariants {
  const rng = getRng(seed);
  return {
    promptChar: pick(rng, ['$', '>', '#', '~', '\u276F'] as const),
    bulletGlyph: pick(rng, ['\u2022', '\u25B8', '\u25AA', '\u25E6', '\u203A', '\u25AB'] as const),
    scanlineGap: pick(rng, [1, 2, 3] as const),
    watermarkLabel: pick(rng, ['CTRL+C', 'ESC', '^Z', 'TAB'] as const),
    watermarkCorner: pick(rng, ['tl', 'tr', 'bl', 'br'] as const),
  };
}
