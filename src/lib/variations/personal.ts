import type { Seed } from './_shared';

export interface PersonalVariants {
  _placeholder: 'personal';
}

export function pickPersonalVariants(_seed: Seed): PersonalVariants {
  return { _placeholder: 'personal' };
}
