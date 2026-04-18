import type { Seed } from './_shared';

export interface PoliticalVariants {
  _placeholder: 'political';
}

export function pickPoliticalVariants(_seed: Seed, _created?: Date): PoliticalVariants {
  return { _placeholder: 'political' };
}
