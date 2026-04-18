import { config, fields, collection } from '@keystatic/core';

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
            slug: fields.text({ label: 'Target slug' }),
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
        }),
      },
    }),
  },
});
