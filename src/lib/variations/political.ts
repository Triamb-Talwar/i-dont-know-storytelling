import { getRng, pick, pickInt } from '../seed';

export interface PoliticalVariants {
  /** Ornament used in hr / section-break pseudo-elements. */
  sectionOrnament: '\u2726' | '\u2766' | '\u00A7' | '\u00B6' | '\u2767' | '\u2756' | '\u2727';
  /** CSS column-rule style for the body two-column layout. */
  columnRule: 'solid' | 'dotted' | 'double';
  /** Masthead label like "Vol. 3 · Issue №42" — deterministic from date + slug. */
  issueMasthead: string;
  /** Rotation of the weathered stamp (degrees, 3–15). */
  stampRot: number;
  /** Opacity of the weathered stamp (0.08–0.15). */
  stampOpacity: number;
}

export function pickPoliticalVariants(seed: number, created?: Date): PoliticalVariants {
  const rng = getRng(seed);
  const d = created ?? new Date();
  const vol = d.getFullYear() - 2023;
  const issueNum = pickInt(rng, 1, 99);
  // Stamp leans one direction — randomly left or right (sign from another rng call).
  const sign = rng() < 0.5 ? -1 : 1;
  return {
    sectionOrnament: pick(rng, ['\u2726', '\u2766', '\u00A7', '\u00B6', '\u2767', '\u2756', '\u2727'] as const),
    columnRule: pick(rng, ['solid', 'dotted', 'double'] as const),
    issueMasthead: `Vol.\u00A0${vol}\u00A0\u00B7\u00A0Issue\u00A0\u2116${issueNum}`,
    stampRot: sign * pickInt(rng, 3, 15),
    stampOpacity: Math.round((0.08 + rng() * 0.07) * 100) / 100,
  };
}
