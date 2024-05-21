import { defineDocumentType, makeSource } from 'contentlayer2/source-files'
import { FILENAME_SUBSTRING } from './lib/posts'

export const BlogPost = defineDocumentType(() => ({
  name: 'BlogPost',
  filePathPattern: `**/*.mdx`,
  contentType: 'mdx',
  fields: {
    author: { type: 'string', required: true },
    author_url: { type: 'string', required: false },
    author_title: { type: 'string', required: false },
    author_image_url: { type: 'string', required: false },
    date: { type: 'string', required: true },
    description: { type: 'string', required: true },
    categories: { type: 'list', of: { type: 'string' }, required: true },
    image: { type: 'string', required: false },
    launchweek: { type: 'string', required: false },
    published_at: { type: 'string', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    title: { type: 'string', required: true },
    thumb: { type: 'string', required: false },
    toc_depth: { type: 'number', required: false },
    video: { type: 'string', required: false },
    youtubeHero: { type: 'string', required: false },
  },
  computedFields: {
    url: {
      type: 'string',
      resolve: (post) => {
        const slug = post._raw.flattenedPath.replace('.mdx', '').substring(FILENAME_SUBSTRING)
        return `/blog/${slug}`
      },
    },
  },
}))

export default makeSource({ contentDirPath: '_blog', documentTypes: [BlogPost] })
