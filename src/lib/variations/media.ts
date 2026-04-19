import { getRng, pick, pickInt } from '../seed';

export interface MediaVariants {
  /** Filmic color tint applied as a subtle background overlay. */
  filmTint: 'warm' | 'cool' | 'neutral';
  /** Single-digit film-reel countdown number (1–9). */
  countdownNum: number;
  /** Subtitle-style timecode in HH:MM:SS format, computed from slug seed. */
  timestampLabel: string;
}

function toTimecode(seed: number): string {
  const h = seed % 2;
  const m = seed % 60;
  const s = (seed >>> 8) % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export function pickMediaVariants(seed: number, _created?: Date): MediaVariants {
  const rng = getRng(seed);
  return {
    filmTint: pick(rng, ['warm', 'cool', 'neutral'] as const),
    countdownNum: pickInt(rng, 1, 9),
    timestampLabel: toTimecode(seed),
  };
}
