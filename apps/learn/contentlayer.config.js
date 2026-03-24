import { getHighlighter, loadTheme } from '@shikijs/compat'
import { defineDocumentType, defineNestedType, makeSource } from 'contentlayer2/source-files'
import path from 'path'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import { codeImport } from 'remark-code-import'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'

/** @type {import('contentlayer2/source-files').ComputedFields} */
const computedFields = {
  slug: {
    type: 'string',
    resolve: (doc) => `/${doc._raw.flattenedPath}`,
  },
  slugAsParams: {
    type: 'string',
    resolve: (doc) => doc._raw.flattenedPath,
  },
}

const LinksProperties = defineNestedType(() => ({
  name: 'LinksProperties',
  fields: {
    doc: {
      type: 'string',
    },
    api: {
      type: 'string',
    },
  },
}))

const ExploreItem = defineNestedType(() => ({
  name: 'ExploreItem',
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    link: {
      type: 'string',
      required: true,
    },
    itemType: {
      type: 'string',
      required: false,
    },
    description: {
      type: 'string',
      required: false,
    },
  },
}))

const CourseHero = defineNestedType(() => ({
  name: 'CourseHero',
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    subtitle: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: true,
    },
  },
}))

const NestedProperties = defineNestedType(() => ({
  name: 'NestedProperties',
  fields: {
    radix: {
      type: 'boolean',
    },
    shadcn: {
      type: 'boolean',
    },
    vaul: {
      type: 'boolean',
    },
    inputOtp: {
      type: 'boolean',
    },
    reactAccessibleTreeview: {
      type: 'boolean',
    },
  },
}))

export const Doc = defineDocumentType(() => ({
  name: 'Doc',
  filePathPattern: `**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: {
      type: 'string',
      required: true,
    },
    description: {
      type: 'string',
      required: true,
    },
    published: {
      type: 'boolean',
      default: true,
    },
    links: {
      type: 'nested',
      of: LinksProperties,
    },
    featured: {
      type: 'boolean',
      default: false,
      required: false,
    },
    component: {
      type: 'boolean',
      default: false,
      required: false,
    },
    fragment: {
      type: 'boolean',
      default: false,
      required: false,
    },
    toc: {
      type: 'boolean',
      default: true,
      required: false,
    },
    chapterNumber: {
      type: 'number',
      required: false,
    },
    explore: {
      type: 'list',
      of: ExploreItem,
      required: false,
    },
    courseHero: {
      type: 'nested',
      of: CourseHero,
      required: false,
    },
    source: {
      type: 'nested',
      of: NestedProperties,
    },
  },
  computedFields,
}))

const config = makeSource({
  contentDirPath: './content',
  documentTypes: [Doc],
  mdx: {
    remarkPlugins: [remarkGfm, codeImport],
    rehypePlugins: [
      rehypeSlug,
      () => (tree) => {
        visit(tree, (node) => {
          if (node?.type === 'element' && node?.tagName === 'pre') {
            const [codeEl] = node.children
            if (codeEl.tagName !== 'code') {
              return
            }

            if (codeEl.data?.meta) {
              // Extract event from meta and pass it down the tree.
              const regex = /event="([^"]*)"/
              const match = codeEl.data?.meta.match(regex)
              if (match) {
                node.__event__ = match ? match[1] : null
                codeEl.data.meta = codeEl.data.meta.replace(regex, '')
              }
            }

            node.__rawString__ = codeEl.children?.[0].value
            node.__src__ = node.properties?.__src__
            node.__style__ = node.properties?.__style__
          }
        })
      },
      [
        rehypePrettyCode,
        // rehypePrettyCodeOptions,
        {
          getHighlighter: async () => {
            const theme = await loadTheme(path.join(process.cwd(), '/lib/themes/supabase-2.json'))
            return await getHighlighter({ theme })
          },
          onVisitLine(node) {
            // Prevent lines from collapsing in `display: grid` mode, and allow empty
            // lines to be copy/pasted
            if (node.children.length === 0) {
              node.children = [{ type: 'text', value: ' ' }]
            }
          },
          onVisitHighlightedLine(node) {
            node.properties.className.push('line--highlighted')
          },
          onVisitHighlightedWord(node) {
            node.properties.className = ['word--highlighted']
          },
        },
      ],
      () => (tree) => {
        visit(tree, (node) => {
          if (node?.type === 'element' && node?.tagName === 'div') {
            if (!('data-rehype-pretty-code-fragment' in node.properties)) {
              return
            }

            const preElement = node.children.at(-1)
            if (preElement.tagName !== 'pre') {
              return
            }

            preElement.properties['__withMeta__'] = node.children.at(0).tagName === 'div'
            preElement.properties['__rawString__'] = node.__rawString__

            if (node.__src__) {
              preElement.properties['__src__'] = node.__src__
            }

            if (node.__event__) {
              preElement.properties['__event__'] = node.__event__
            }

            if (node.__style__) {
              preElement.properties['__style__'] = node.__style__
            }
          }
        })
      },
      // rehypeNpmCommand,
      [
        rehypeAutolinkHeadings,
        {
          properties: {
            className: ['subheading-anchor'],
            ariaLabel: 'Link to section',
          },
        },
      ],
    ],
  },
})

export { config as default }
