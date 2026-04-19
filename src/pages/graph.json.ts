import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { buildGraph, type PostInput } from '@lib/graph-data';

export const GET: APIRoute = async () => {
  const entries = await getCollection('posts');

  const posts: PostInput[] = entries.map((e) => ({
    title: e.data.title,
    slug: e.data.slug ?? e.id,
    category: e.data.category,
    visibility: e.data.visibility,
    created: e.data.created,
    tags: e.data.tags,
    links: e.data.links,
  }));

  const graph = buildGraph(posts, { includePrivate: true });

  // Redact private nodes so titles/tags don't leak via the public JSON.
  // The client still sees category + position so the teaser dot renders.
  const remap = new Map<string, string>();
  for (const n of graph.nodes) {
    if (n.visibility === 'private') remap.set(n.id, `private-${hash(n.id)}`);
  }
  const privateIds = new Set(remap.keys());

  graph.nodes = graph.nodes.map((n) =>
    n.visibility === 'private'
      ? { ...n, id: remap.get(n.id)!, title: 'private', tags: [] }
      : n,
  );
  graph.edges = graph.edges
    // Keep teaser dots private: do not leak private topology through edges.
    .filter((e) => !privateIds.has(e.source) && !privateIds.has(e.target))
    .map((e) => ({
      ...e,
      source: remap.get(e.source) ?? e.source,
      target: remap.get(e.target) ?? e.target,
      reason: e.reason,
    }))
    .filter((e) => e.source !== e.target);

  return new Response(JSON.stringify(graph), {
    headers: { 'Content-Type': 'application/json' },
  });
};

function hash(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h.toString(36);
}
