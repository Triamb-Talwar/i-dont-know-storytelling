import type { Category } from '@lib/categories';
import { hashSlug } from '@lib/seed';
import { pickTechVariants, type TechVariants } from './tech';
import { pickPersonalVariants, type PersonalVariants } from './personal';
import { pickPoliticalVariants, type PoliticalVariants } from './political';
import { pickMediaVariants, type MediaVariants } from './media';
import { pickJournalVariants, type JournalVariants } from './journal';

export type Variants =
  | TechVariants
  | PersonalVariants
  | PoliticalVariants
  | MediaVariants
  | JournalVariants;

export { pickJournalVariants };
export type { JournalVariants };

export function getVariants(category: Category, slug: string, created?: Date): Variants {
  const seed = hashSlug(slug);
  switch (category) {
    case 'tech':
      return pickTechVariants(seed);
    case 'personal':
      return pickPersonalVariants(seed);
    case 'political':
      return pickPoliticalVariants(seed, created);
    case 'media':
      return pickMediaVariants(seed, created);
    case 'journal':
      return pickJournalVariants(seed);
  }
}

/** Convert variants object into data-* attrs for the post root element.
 *  Numeric and boolean values are stringified; keys prefixed with `_` are
 *  treated as internal placeholders and skipped. */
export function variantsToDataAttrs(v: Variants): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const [key, value] of Object.entries(v)) {
    if (key.startsWith('_')) continue;
    attrs[`data-variant-${key}`] = String(value);
  }
  return attrs;
}
