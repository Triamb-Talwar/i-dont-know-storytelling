// Astro content collections config.
// Real Zod schema for posts lands in Task 1.1 per TASKS.md.
import { defineCollection } from 'astro:content';

const posts = defineCollection({
  type: 'content',
});

export const collections = { posts };
