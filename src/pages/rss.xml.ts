import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const posts = await getCollection('posts', ({ data }) => data.visibility === 'public');
  posts.sort((a, b) => b.data.created.getTime() - a.data.created.getTime());

  return rss({
    title: "i don't know storytelling",
    description: 'a personal blog as an interconnected graph.',
    site: context.site ?? 'https://idkstorytelling.com',
    items: posts.map((p) => ({
      title: p.data.title,
      pubDate: p.data.created,
      link: `/posts/${p.data.slug ?? p.id}/`,
      categories: [p.data.category, ...p.data.tags],
    })),
    customData: '<language>en-us</language>',
  });
};
