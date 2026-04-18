import { describe, it, expect } from 'vitest';
import { buildGraph, type PostInput } from './graph-data';

const NOW = new Date('2026-04-18T00:00:00Z');

function post(overrides: Partial<PostInput>): PostInput {
  return {
    title: 'untitled',
    slug: 'untitled',
    category: 'journal',
    visibility: 'public',
    created: new Date('2026-04-18T00:00:00Z'),
    tags: [],
    links: [],
    ...overrides,
  };
}

describe('buildGraph', () => {
  it('returns empty graph for no posts', () => {
    const g = buildGraph([], { now: NOW });
    expect(g.nodes).toEqual([]);
    expect(g.edges).toEqual([]);
  });

  it('filters private posts out by default', () => {
    const posts = [
      post({ slug: 'a', visibility: 'public' }),
      post({ slug: 'b', visibility: 'private' }),
    ];
    const g = buildGraph(posts, { now: NOW });
    expect(g.nodes.map((n) => n.id)).toEqual(['a']);
  });

  it('includes private posts when includePrivate is true', () => {
    const posts = [
      post({ slug: 'a', visibility: 'public' }),
      post({ slug: 'b', visibility: 'private' }),
    ];
    const g = buildGraph(posts, { now: NOW, includePrivate: true });
    expect(g.nodes.map((n) => n.id).sort()).toEqual(['a', 'b']);
  });

  it('derives size 1 for public, 0.25 for private', () => {
    const posts = [
      post({ slug: 'pub', visibility: 'public' }),
      post({ slug: 'priv', visibility: 'private' }),
    ];
    const g = buildGraph(posts, { now: NOW, includePrivate: true });
    const pub = g.nodes.find((n) => n.id === 'pub')!;
    const priv = g.nodes.find((n) => n.id === 'priv')!;
    expect(pub.size).toBe(1);
    expect(priv.size).toBe(0.25);
  });

  it('derives age_days from created to now, floored, never negative', () => {
    const posts = [
      post({ slug: 'today', created: new Date('2026-04-18T00:00:00Z') }),
      post({ slug: 'a-week-ago', created: new Date('2026-04-11T00:00:00Z') }),
      post({ slug: 'half-day-ago', created: new Date('2026-04-17T12:00:00Z') }),
      post({ slug: 'future', created: new Date('2026-05-01T00:00:00Z') }),
    ];
    const g = buildGraph(posts, { now: NOW });
    expect(g.nodes.find((n) => n.id === 'today')!.age_days).toBe(0);
    expect(g.nodes.find((n) => n.id === 'a-week-ago')!.age_days).toBe(7);
    expect(g.nodes.find((n) => n.id === 'half-day-ago')!.age_days).toBe(0);
    expect(g.nodes.find((n) => n.id === 'future')!.age_days).toBe(0);
  });

  it('drops edges that point to non-existent or private posts', () => {
    const posts = [
      post({ slug: 'a', links: [{ slug: 'b', strength: 0.5 }, { slug: 'ghost', strength: 0.5 }] }),
      post({ slug: 'b', visibility: 'private' }),
    ];
    const g = buildGraph(posts, { now: NOW });
    expect(g.edges).toEqual([]);
  });

  it('drops self-links', () => {
    const posts = [post({ slug: 'a', links: [{ slug: 'a', strength: 1 }] })];
    const g = buildGraph(posts, { now: NOW });
    expect(g.edges).toEqual([]);
  });

  it('dedupes bidirectional edges into one undirected edge', () => {
    const posts = [
      post({ slug: 'a', links: [{ slug: 'b', strength: 0.4, reason: 'a->b' }] }),
      post({ slug: 'b', links: [{ slug: 'a', strength: 0.9, reason: 'b->a' }] }),
    ];
    const g = buildGraph(posts, { now: NOW });
    expect(g.edges).toHaveLength(1);
    const edge = g.edges[0];
    expect(edge.source).toBe('a');
    expect(edge.target).toBe('b');
    expect(edge.strength).toBe(0.9);
    expect(edge.reason).toBe('a->b / b->a');
  });

  it('keeps one edge when only one direction is defined', () => {
    const posts = [
      post({ slug: 'a', links: [{ slug: 'b', strength: 0.5, reason: 'because' }] }),
      post({ slug: 'b' }),
    ];
    const g = buildGraph(posts, { now: NOW });
    expect(g.edges).toHaveLength(1);
    expect(g.edges[0]).toMatchObject({ source: 'a', target: 'b', reason: 'because', strength: 0.5 });
  });

  it('collapses duplicate same-direction links without mangling reason', () => {
    const posts = [
      post({
        slug: 'a',
        links: [
          { slug: 'b', strength: 0.3, reason: 'shared' },
          { slug: 'b', strength: 0.8, reason: 'shared' },
        ],
      }),
      post({ slug: 'b' }),
    ];
    const g = buildGraph(posts, { now: NOW });
    expect(g.edges).toHaveLength(1);
    expect(g.edges[0].strength).toBe(0.8);
    expect(g.edges[0].reason).toBe('shared');
  });

  it('passes through core node fields from frontmatter', () => {
    const posts = [
      post({
        slug: 'jonah',
        title: 'why jonah brute-forces sql',
        category: 'tech',
        tags: ['jonah', 'sql'],
      }),
    ];
    const g = buildGraph(posts, { now: NOW });
    expect(g.nodes[0]).toMatchObject({
      id: 'jonah',
      title: 'why jonah brute-forces sql',
      category: 'tech',
      tags: ['jonah', 'sql'],
      visibility: 'public',
    });
  });
});
