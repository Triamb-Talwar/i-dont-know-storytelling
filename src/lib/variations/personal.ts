import { getRng, pick, pickInt, pickFloat } from '../seed';

export interface PersonalVariants {
  /** Display font used for the drop cap on the opening paragraph. */
  dropCapFont: 'playfair' | 'cormorant' | 'bodoni';
  /** X position of the ink-blot SVG (% from left of post-main). */
  inkBlotX: number;
  /** Y position of the ink-blot SVG (% from top of post-main). */
  inkBlotY: number;
  /** Rotation angle of the ink-blot SVG (degrees). */
  inkBlotRot: number;
  /** Opacity of the ink-blot SVG (0.22–0.38). */
  inkBlotOpacity: number;
  /** Marginalia rotation applied to pull-quotes / blockquotes (deg). */
  marginaliaRot: number;
  /** Rough.js roughness used when sketching link underlines. */
  underlineRoughness: number;
}

export function pickPersonalVariants(seed: number): PersonalVariants {
  const rng = getRng(seed);
  const rotSign = rng() < 0.5 ? -1 : 1;
  return {
    dropCapFont: pick(rng, ['playfair', 'cormorant', 'bodoni'] as const),
    inkBlotX: pickInt(rng, 15, 85),
    inkBlotY: pickInt(rng, 20, 80),
    inkBlotRot: pickInt(rng, 0, 359),
    inkBlotOpacity: Math.round(pickFloat(rng, 0.22, 0.38) * 100) / 100,
    marginaliaRot: rotSign * pickInt(rng, 2, 8),
    underlineRoughness: Math.round(pickFloat(rng, 0.5, 1.5) * 100) / 100,
  };
}
