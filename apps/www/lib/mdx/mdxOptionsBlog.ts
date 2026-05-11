import { remarkCodeHike, type CodeHikeConfig } from '@code-hike/mdx'
import codeHikeTheme from 'config/code-hike.theme.json' with { type: 'json' }
import type { SerializeOptions } from 'next-mdx-remote-client/serialize'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

const codeHikeOptions: CodeHikeConfig = {
  theme: codeHikeTheme,
  lineNumbers: true,
  showCopyButton: true,
  skipLanguages: ['mermaid'],
  autoImport: false,
}

type MdxOptions = NonNullable<SerializeOptions['mdxOptions']>

export const mdxOptionsBlog: MdxOptions = {
  remarkPlugins: [remarkNormalizeHtmlImages, [remarkCodeHike, codeHikeOptions], remarkGfm],
  rehypePlugins: [
    // @ts-ignore
    rehypeSlug,
  ],
}

/**
 * Remark plugin: converts raw HTML `<img>` nodes and MDX JSX `<img />` elements
 * to standard markdown `image` AST nodes so they go through the mdxComponents
 * img rendering pipeline.
 */
function remarkNormalizeHtmlImages() {
  return function transformer(tree: any) {
    const getAttrFromString = (attrs: string, name: string) => {
      const m = attrs.match(new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'))
      return (m?.[2] ?? m?.[3] ?? '').trim()
    }

    const walk = (node: any, parent: any, index: number) => {
      if (node.type === 'code' || node.type === 'inlineCode') return

      if (parent !== null) {
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
