import { describe, it, expect } from 'vitest';
import { hashSlug, getRng, pick, pickInt, pickFloat } from './seed';

describe('hashSlug', () => {
  it('is deterministic', () => {
    expect(hashSlug('jonah')).toBe(hashSlug('jonah'));
    expect(hashSlug('god-of-war-ragnarok')).toBe(hashSlug('god-of-war-ragnarok'));
  });

  it('produces different seeds for different inputs', () => {
    expect(hashSlug('a')).not.toBe(hashSlug('b'));
    expect(hashSlug('jonah')).not.toBe(hashSlug('jonah-')); // trailing char flips hash
  });

  it('has reasonable distribution across 100 slugs', () => {
    const seeds = new Set<number>();
    for (let i = 0; i < 100; i++) {
      seeds.add(hashSlug(`post-${i}-${String.fromCharCode(65 + (i % 26))}`));
    }
    expect(seeds.size).toBe(100);
  });

  it('returns a non-negative 32-bit integer', () => {
    const samples = ['', 'a', 'jonah', 'x'.repeat(200)];
    for (const s of samples) {
      const h = hashSlug(s);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(2 ** 32);
      expect(Number.isInteger(h)).toBe(true);
    }
  });
});

describe('getRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = getRng(42);
    const b = getRng(42);
    for (let i = 0; i < 50; i++) {
      expect(a()).toBe(b());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = getRng(1);
    const b = getRng(2);
    const firstFromA = a();
    const firstFromB = b();
    expect(firstFromA).not.toBe(firstFromB);
  });

  it('stays in [0, 1)', () => {
    const rng = getRng(hashSlug('distribution-check'));
    for (let i = 0; i < 10_000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('pick', () => {
  it('always returns an element of the array', () => {
    const rng = getRng(999);
    const arr = ['a', 'b', 'c', 'd', 'e'] as const;
    for (let i = 0; i < 1000; i++) {
      const v = pick(rng, arr);
      expect(arr).toContain(v);
    }
  });

  it('is deterministic for the same seed', () => {
    const arr = ['w', 'x', 'y', 'z'] as const;
    const a = pick(getRng(7), arr);
    const b = pick(getRng(7), arr);
    expect(a).toBe(b);
  });
});

describe('pickInt', () => {
  it('stays within inclusive bounds', () => {
    const rng = getRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = pickInt(rng, 3, 9);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(9);
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe('pickFloat', () => {
  it('stays within [min, max)', () => {
    const rng = getRng(123);
    for (let i = 0; i < 1000; i++) {
      const v = pickFloat(rng, 0.5, 1.5);
      expect(v).toBeGreaterThanOrEqual(0.5);
      expect(v).toBeLessThan(1.5);
    }
  });
});
