import { remark } from 'remark'
import remarkGfm from 'remark-gfm'

type TocItem = { content: string; slug: string; lvl: number }

function createRemarkCollectToc(maxDepth: number) {
  return function remarkCollectToc() {
    return function transformer(tree: any) {
      const items: Array<TocItem> = []

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

      if (!tree.data) {
        tree.data = {}
      }
      tree.data.__collectedToc = items
    }
  }
}

export async function extractToc(
  rawMdx: string,
  depth: number
): Promise<{ content: string; json: Array<TocItem> }> {
  let collectedToc: Array<TocItem> = []

  await remark()
    .use(remarkGfm)
    .use(() => {
      const plugin = createRemarkCollectToc(depth)
      const transformer = (plugin as any)()
      return (tree: any) => {
        transformer(tree)
        if (tree?.data?.__collectedToc) {
          collectedToc = tree.data.__collectedToc as Array<TocItem>
        }
      }
    })
    .process(rawMdx)

  const minLvl = collectedToc.length > 0 ? Math.min(...collectedToc.map((h) => h.lvl)) : 1
  const tocMarkdown = collectedToc
    .map((h) => `${'  '.repeat(Math.max(0, h.lvl - minLvl))}- [${h.content}](#${h.slug})`)
    .join('\n')

  return { content: tocMarkdown, json: collectedToc }
}
