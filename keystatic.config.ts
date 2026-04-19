import { config, fields, collection } from '@keystatic/core';
import { block, inline } from '@keystatic/core/content-components';

const isProd = import.meta.env.PROD;

export default config({
  storage: isProd
    ? {
        kind: 'github',
        repo: 'Triamb-Talwar/i-dont-know-storytelling',
      }
    : { kind: 'local' },
  collections: {
    posts: collection({
      label: 'Posts',
      slugField: 'slug',
      path: 'src/content/posts/*',
      format: { contentField: 'content' },
      entryLayout: 'content',
      schema: {
        title: fields.text({ label: 'Title', validation: { isRequired: true } }),
        slug: fields.text({ label: 'Slug', validation: { isRequired: true } }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Tech', value: 'tech' },
            { label: 'Personal', value: 'personal' },
            { label: 'Political', value: 'political' },
            { label: 'Media', value: 'media' },
            { label: 'Journal', value: 'journal' },
          ],
          defaultValue: 'journal',
        }),
        visibility: fields.select({
          label: 'Visibility',
          options: [
            { label: 'Public', value: 'public' },
            { label: 'Private', value: 'private' },
          ],
          defaultValue: 'public',
        }),
        created: fields.date({ label: 'Created', validation: { isRequired: true } }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value,
        }),
        links: fields.array(
          fields.object({
            slug: fields.relationship({
              label: 'Target post',
              collection: 'posts',
              validation: { isRequired: true },
            }),
            reason: fields.text({ label: 'Reason for link' }),
            strength: fields.number({ label: 'Strength', defaultValue: 0.5 }),
          }),
          {
            label: 'Links (graph edges)',
            itemLabel: (props) => props.fields.slug.value || 'new link',
          },
        ),
        content: fields.mdx({
          label: 'Content',
          components: {
            // Inline @-mention: picks any post from the collection, renders a
            // category-themed link in the prose. The MDX output looks like
            // `<Node slug="some-slug" label="text" />` — see
            // src/components/post/Node.astro for the render side.
            AsciiCanvas: block({
              label: 'ASCII canvas',
              schema: {
                name: fields.text({
                  label: 'Asset name',
                  description:
                    'Filename in /public/ascii/ without extension. e.g. "missile" → /public/ascii/missile.json',
                  validation: { isRequired: true },
                }),
                label: fields.text({ label: 'Accessible label (optional)' }),
                size: fields.number({
                  label: 'Font size (rem)',
                  defaultValue: 0.75,
                }),
                align: fields.select({
                  label: 'Align',
                  options: [
                    { label: 'Left', value: 'left' },
                    { label: 'Center', value: 'center' },
                    { label: 'Right', value: 'right' },
                  ],
                  defaultValue: 'center',
                }),
              },
            }),
            Node: inline({
              label: 'Node link',
              schema: {
                slug: fields.relationship({
                  label: 'Target post',
                  collection: 'posts',
                  validation: { isRequired: true },
                }),
                label: fields.text({
                  label: 'Display text (optional — defaults to target title)',
                }),
              },
            }),
          },
        }),
      },
    }),
  },
});
