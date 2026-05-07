import { serialize } from 'next-mdx-remote/serialize'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import { type CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import codeHikeTheme from 'config/code-hike.theme.json' with { type: 'json' }
import { preprocessMdxWithCodeTabs } from '~/components/CodeTabs'

// mdx2 needs self-closing tags.
// dragging an image onto a GitHub discussion creates an <img>
// we need to fix this before running them through mdx
// also checks for <br> and <hr>
function addSelfClosingTags(htmlString: string): string {
  // Handle cases where htmlString might be undefined, null, or not a string
  if (!htmlString || typeof htmlString !== 'string') {
    return ''
  }

  const modifiedHTML = htmlString.replace(/<img[^>]*>|<br[^>]*>|<hr[^>]*>/g, (match) => {
    if (match.endsWith('/>')) {
      return match
    } else {
      // Add slash (/) to make it self-closing
      return match.slice(0, -1) + ' />'
    }
  })
  return modifiedHTML
}

type TocItem = { content: string; slug: string; lvl: number }

function createRemarkCollectToc(maxDepth: number) {
  return function remarkCollectToc() {
    return function transformer(tree: any) {
      const items: TocItem[] = []

      const getText = (node: any): string => {
        if (!node) return ''
        if (node.type === 'text') return node.value || ''
        if (Array.isArray(node.children)) return node.children.map(getText).join('')
        return ''
      }

      const slugify = (input: string) =>
        input
          .trim()
          .toLowerCase()
          .replace(/[`~!@#$%^&*()+=|{}\[\]\\:";'<>?,./]+/g, '')
          .replace(/\s+/g, '-')

      const walk = (node: any) => {
        if (node.type === 'heading' && typeof node.depth === 'number') {
          if (node.depth <= maxDepth) {
            const text = getText(node)
            if (text) {
              items.push({ content: text, slug: slugify(text), lvl: node.depth })
            }
          }
        }
        if (node.children) {
          for (const child of node.children) walk(child)
        }
      }

      walk(tree)

      // Attach to tree data for retrieval post-serialize
      if (!tree.data) {
        tree.data = {}
      }
      tree.data.__collectedToc = items
    }
  }
}

export async function mdxSerialize(source: string, options?: { tocDepth?: number }) {
  const formattedSource = addSelfClosingTags(source)
  // Preprocess MDX to handle CodeTabs transformation
  const preprocessedSource = await preprocessMdxWithCodeTabs(formattedSource)
  const codeHikeOptions: CodeHikeConfig = {
    theme: codeHikeTheme,
    lineNumbers: true,
    showCopyButton: true,
    skipLanguages: ['mermaid'],
    autoImport: false,
  }

  const tocDepth = options?.tocDepth ?? 2
  let collectedToc: TocItem[] = []

  const mdxSource = await serialize(preprocessedSource, {
    blockJS: false,
    scope: {
      chCodeConfig: codeHikeOptions,
    },
    mdxOptions: {
      remarkPlugins: [
        [remarkCodeHike, codeHikeOptions],
        remarkGfm,
        // Collect headings into a simple TOC structure
        () => {
          const plugin = createRemarkCollectToc(tocDepth)
          const transformer = (plugin as any)()
          return (tree: any) => {
            transformer(tree)
            if (tree?.data?.__collectedToc) {
              collectedToc = tree.data.__collectedToc as TocItem[]
            }
          }
        },
      ],
      rehypePlugins: [
        // @ts-ignore
        rehypeSlug, // add IDs to any h1-h6 tag that doesn't have one, using a slug made from its text
      ],
    },
  })

  // Expose TOC via scope for consumers (keeps function signature stable)
  const tocMarkdown = collectedToc
    .map((h) => `${'  '.repeat(Math.max(0, h.lvl - 1))}- [${h.content}](#${h.slug})`)
    .join('\n')

  mdxSource.scope = {
    ...(mdxSource.scope || {}),
    toc: {
      content: tocMarkdown,
      json: collectedToc,
    },
  }

  return mdxSource
}
