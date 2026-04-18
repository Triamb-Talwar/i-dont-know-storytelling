export type Category = 'tech' | 'personal' | 'political' | 'media' | 'journal';

export interface PostInput {
  title: string;
  slug: string;
  category: Category;
  visibility: 'public' | 'private';
  created: Date;
  tags: string[];
  links: Array<{ slug: string; reason?: string; strength: number }>;
}

export interface GraphNode {
  id: string;
  title: string;
  category: Category;
  visibility: 'public' | 'private';
  size: number;
  age_days: number;
  tags: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  reason?: string;
  strength: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface BuildGraphOptions {
  includePrivate?: boolean;
  now?: Date;
}

const SIZE = { public: 1, private: 0.25 } as const;
const MS_PER_DAY = 86_400_000;

export function buildGraph(posts: PostInput[], opts: BuildGraphOptions = {}): GraphData {
  const { includePrivate = false, now = new Date() } = opts;

  const visiblePosts = includePrivate ? posts : posts.filter((p) => p.visibility === 'public');
  const idSet = new Set(visiblePosts.map((p) => p.slug));

  const nodes: GraphNode[] = visiblePosts.map((p) => ({
    id: p.slug,
    title: p.title,
    category: p.category,
    visibility: p.visibility,
    size: SIZE[p.visibility],
    age_days: Math.max(0, Math.floor((now.getTime() - p.created.getTime()) / MS_PER_DAY)),
    tags: p.tags,
  }));

  const edgeMap = new Map<string, GraphEdge>();
  for (const post of visiblePosts) {
    for (const link of post.links) {
      if (post.slug === link.slug) continue;
      if (!idSet.has(link.slug)) continue;

      const [a, b] = [post.slug, link.slug].sort();
      const key = `${a}::${b}`;
      const existing = edgeMap.get(key);

      if (!existing) {
        edgeMap.set(key, {
          source: a,
          target: b,
          reason: link.reason,
          strength: link.strength,
        });
      } else {
        existing.strength = Math.max(existing.strength, link.strength);
        if (link.reason && existing.reason && existing.reason !== link.reason) {
          existing.reason = `${existing.reason} / ${link.reason}`;
        } else if (link.reason && !existing.reason) {
          existing.reason = link.reason;
        }
      }
    }
  }

  return { nodes, edges: Array.from(edgeMap.values()) };
}
