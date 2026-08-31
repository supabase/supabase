import path from 'path'
import { getHighlighter, loadTheme } from '@shikijs/compat'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import { codeImport } from 'remark-code-import'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import { defineConfig, s } from 'velite'

import { rehypeComponent } from './lib/rehype-component'

const LinksProperties = s.object({
  doc: s.string().optional(),
  api: s.string().optional(),
})

const NestedProperties = s.object({
  radix: s.boolean().optional(),
  shadcn: s.boolean().optional(),
  vaul: s.boolean().optional(),
  inputOtp: s.boolean().optional(),
  reactAccessibleTreeview: s.boolean().optional(),
  recharts: s.boolean().optional(),
})

const docs = s
  .object({
    title: s.string(),
    description: s.string(),
    published: s.boolean().default(true),
    links: LinksProperties.optional(),
    featured: s.boolean().default(false),
    component: s.boolean().default(false),
    fragment: s.boolean().default(false),
    toc: s.boolean().default(true),
    source: NestedProperties.optional(),
    // mirrors contentlayer2's `_raw.flattenedPath`: file path relative to the
    // content dir, extension stripped, trailing `/index` dropped.
    path: s.path(),
    raw: s.raw(),
    // internal doc cross-links (e.g. `[Button](components/button)`) aren't
    // real files on disk — disable Velite's default asset-copying behavior,
    // which otherwise treats every relative link as a local file to copy.
    // Minification is also disabled: it's pure CPU-bound Terser work with no
    // real benefit for a dev-only content cache, and dominates build time.
    code: s.mdx({ copyLinkedFiles: false, minify: false }),
  })
  .transform(({ path: flattenedPath, ...data }) => ({
    ...data,
    slug: `/${flattenedPath}`,
    slugAsParams: flattenedPath.split('/').slice(1).join('/'),
  }))

export default defineConfig({
  root: './content',
  output: {
    clean: true,
  },
  collections: {
    allDocs: {
      name: 'Doc',
      pattern: 'docs/**/*.mdx',
      schema: docs,
    },
  },
  mdx: {
    remarkPlugins: [remarkGfm, codeImport],
    rehypePlugins: [
      rehypeSlug,
      rehypeComponent,
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
        {
          // Memoized so the (expensive) theme parse + oniguruma WASM init runs once
          // for the whole build, instead of once per file — velite compiles every
          // file concurrently, so without this every doc pays that cost redundantly.
          getHighlighter: (() => {
            let highlighterPromise
            return () => {
              highlighterPromise ??= loadTheme(
                path.join(process.cwd(), '/lib/themes/supabase-2.json')
              ).then((theme) => getHighlighter({ theme }))
              return highlighterPromise
            }
          })(),
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
