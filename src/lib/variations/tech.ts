import type { Seed } from './_shared';

export interface TechVariants {
  /** placeholder — real variants shipped in a follow-up commit */
  _placeholder: 'tech';
}

export function pickTechVariants(_seed: Seed): TechVariants {
  return { _placeholder: 'tech' };
}
