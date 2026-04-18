import type { Seed } from './_shared';

export interface MediaVariants {
  _placeholder: 'media';
}

export function pickMediaVariants(_seed: Seed, _created?: Date): MediaVariants {
  return { _placeholder: 'media' };
}
