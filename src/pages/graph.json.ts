import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildGraph, type PostInput } from '@lib/graph-data';

export const GET: APIRoute = async () => {
  const entries = await getCollection('posts');

  const posts: PostInput[] = entries.map((e) => ({
    title: e.data.title,
    slug: e.data.slug,
    category: e.data.category,
    visibility: e.data.visibility,
    created: e.data.created,
    tags: e.data.tags,
    links: e.data.links,
  }));

  const graph = buildGraph(posts);

  return new Response(JSON.stringify(graph), {
    headers: { 'Content-Type': 'application/json' },
  });
};
