import { remarkCodeHike, type CodeHikeConfig } from '@code-hike/mdx'
import { preprocessMdxWithCodeTabs } from '~/components/CodeTabs'
import codeHikeTheme from 'config/code-hike.theme.json' with { type: 'json' }
import { serialize } from 'next-mdx-remote/serialize'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

/**
 * Applies a string transform only to content outside fenced code blocks
 * (``` or ~~~) so pre-parse fixes never corrupt code examples.
 */
function transformOutsideCodeFences(source: string, transform: (chunk: string) => string): string {
  const fenceRe = /(^(?:`{3,}|~{3,})[^\n]*\n[\s\S]*?\n(?:`{3,}|~{3,})[ \t]*$)/gm
  const parts = source.split(fenceRe)
  // split() with a capture group: even indices are outside fences, odd are fence blocks
  return parts.map((part, i) => (i % 2 === 0 ? transform(part) : part)).join('')
}

// mdx2 needs self-closing tags.
// dragging an image onto a GitHub discussion creates an <img>
// we need to fix this before running them through mdx
// also checks for <br> and <hr>
function addSelfClosingTags(htmlString: string): string {
  // Handle cases where htmlString might be undefined, null, or not a string
  if (!htmlString || typeof htmlString !== 'string') {
    return ''
  }
  return transformOutsideCodeFences(htmlString, (chunk) =>
    chunk.replace(/<img[^>]*>|<br[^>]*>|<hr[^>]*>/g, (match) =>
      match.endsWith('/>') ? match : match.slice(0, -1) + ' />'
    )
  )
}

/**
 * Remark plugin: converts raw HTML `<img>` nodes and MDX JSX `<img />` elements
 * to standard markdown `image` AST nodes so they go through the mdxComponents
 * img rendering pipeline.
 *
 * Operating on the AST means code/inlineCode nodes are already separate subtrees
 * and are never visited, so code fences are never affected.
 */
function remarkNormalizeHtmlImages() {
  return function transformer(tree: any) {
    const getAttrFromString = (attrs: string, name: string) => {
      const m = attrs.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))
      return (m?.[2] ?? m?.[3] ?? '').trim()
    }

    const walk = (node: any, parent: any, index: number) => {
      // Never descend into code nodes — content there is literal text.
      if (node.type === 'code' || node.type === 'inlineCode') return

      if (parent !== null) {
        // Standard markdown / non-MDX: raw HTML blocks become `html` nodes.
        if (node.type === 'html') {
          const match = /^\s*<img\b([^>]*)\/?>\s*$/i.exec(node.value)
          if (match) {
            const src = getAttrFromString(match[1], 'src')
            if (src) {
              const alt = getAttrFromString(match[1], 'alt')
              parent.children[index] = { type: 'image', url: src, alt, title: null }
              return
            }
          }
        }

        // MDX mode: remark-mdx parses <img /> as mdxJsxFlowElement / mdxJsxTextElement.
        if (
          (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') &&
          node.name === 'img'
        ) {
          const getJsxAttr = (name: string): string => {
            const attr = node.attributes?.find(
              (a: any) => a.type === 'mdxJsxAttribute' && a.name === name
            )
            return typeof attr?.value === 'string' ? attr.value : ''
          }
          const src = getJsxAttr('src')
          if (src) {
            const alt = getJsxAttr('alt')
            parent.children[index] = { type: 'image', url: src, alt, title: null }
            return
          }
        }
      }

      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          walk(node.children[i], node, i)
        }
      }
    }

    walk(tree, null, 0)
  }
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
        remarkNormalizeHtmlImages,
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
