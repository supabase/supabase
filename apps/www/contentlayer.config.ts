import { defineDocumentType, makeSource } from 'contentlayer2/source-files'

export const BlogPost = defineDocumentType(() => ({
  name: 'BlogPost',
  filePathPattern: `**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    description: { type: 'string', required: true },
    date: { type: 'string', required: true },
    author: { type: 'string', required: true },
    author_url: { type: 'string', required: false },
    authorURL: { type: 'string', required: false },
    author_title: { type: 'string', required: false },
    author_image_url: { type: 'string', required: false },
    launchweek: { type: 'number', required: false },
    video: { type: 'string', required: false },
    image: { type: 'string', required: false },
    thumb: { type: 'string', required: false },
    categories: { type: 'list', of: { type: 'string' }, required: true },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    toc_depth: { type: 'number', required: false },
    published_at: { type: 'string', required: false },
    youtubeHero: { type: 'string', required: false },
  },
  computedFields: {
    url: { type: 'string', resolve: (post) => `/blog/${post._raw.flattenedPath}` },
  },
}))

export default makeSource({ contentDirPath: '_blog', documentTypes: [BlogPost] })
