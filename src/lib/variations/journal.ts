import { getRng, pick, pickInt } from '../seed';

export interface JournalVariants {
  cornerFold: 'tl' | 'tr' | 'bl' | 'br';
  dateStamp: 'stamp-a' | 'stamp-b' | 'stamp-c';
  marginNote: 'left' | 'right';
  coffeeRingX: number; // 0-100, % from left
  coffeeRingY: number; // 0-100, % from top
  coffeeRingOpacity: number; // 0.04-0.09
}

export function pickJournalVariants(seed: number): JournalVariants {
  const rng = getRng(seed);
  return {
    cornerFold: pick(rng, ['tl', 'tr', 'bl', 'br'] as const),
    dateStamp: pick(rng, ['stamp-a', 'stamp-b', 'stamp-c'] as const),
    marginNote: pick(rng, ['left', 'right'] as const),
    coffeeRingX: pickInt(rng, 10, 90),
    coffeeRingY: pickInt(rng, 15, 85),
    coffeeRingOpacity: Math.round((0.04 + rng() * 0.05) * 100) / 100,
  };
}
