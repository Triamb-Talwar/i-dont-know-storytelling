import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORIES } from '../lib/categories';

const postSchema = z.object({
  title: z.string(),
  // Keystatic derives the slug from the filename and doesn't re-serialize it
  // into frontmatter. Optional here, with callers falling back to `entry.id`.
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  category: z.enum(CATEGORIES),
  visibility: z.enum(['public', 'private']).default('public'),
  created: z.date(),
  updated: z.date().optional(),
  tags: z.array(z.string()).default([]),
  links: z
    .array(
      z.object({
        slug: z.string(),
        reason: z.string().optional(),
        strength: z.number().min(0).max(1).default(0.5),
      }),
    )
    .default([]),
  hero: z
    .object({
      type: z.enum(['ascii', 'image', 'none']).default('none'),
      src: z.string().optional(),
    })
    .optional(),
});

export type Post = z.infer<typeof postSchema>;

const posts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/posts' }),
  schema: postSchema,
});

export const collections = { posts };
