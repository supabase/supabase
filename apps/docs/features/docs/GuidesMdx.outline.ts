import type { Content } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { toString as mdastToString } from 'mdast-util-to-string'
import { mdxjs } from 'micromark-extension-mdxjs'

import type { OutlineBlock } from './GuidesMdx.skeleton'

const toOutlineBlocks = (node: Content): OutlineBlock[] | undefined => {
  const lines = (count: number) => ([1, 2, 3, 4] as const)[Math.min(3, Math.max(0, count - 1))]
  switch (node.type) {
    case 'heading':
      // the template already shows the title
      return node.depth === 1 ? [] : ['heading']
    case 'paragraph':
      // a guide column holds about 90 characters per line
      return [`text-${lines(Math.ceil(mdastToString(node).length / 90))}`]
    case 'list':
      return [`list-${lines(node.children.length)}`]
    case 'code':
      return ['code']
    case 'thematicBreak':
    case 'mdxjsEsm':
      return []
    case 'mdxJsxFlowElement':
      if (node.name === 'Admonition') return ['callout']
      if (node.name === 'Tabs') return ['tabs']
      if (node.name === 'Image' || node.name === 'YouTube') return ['media']
      if (node.name === 'StepHikeCompact') {
        return node.children.flatMap((child) =>
          child.type === 'mdxJsxFlowElement' && child.name === 'StepHikeCompact.Step'
            ? (['step'] as const)
            : []
        )
      }
      return undefined
    default:
      return undefined
  }
}

// only the first screen shows a skeleton, so the outline stops after a few blocks
export const getGuideOutline = (content: string): OutlineBlock[] => {
  const outline: OutlineBlock[] = []
  try {
    const tree = fromMarkdown(content, {
      extensions: [mdxjs()],
      mdastExtensions: [mdxFromMarkdown()],
    })
    for (const node of tree.children) {
      const blocks = toOutlineBlocks(node)
      // a partial or a widget has a size the build cannot know, so the outline ends there
      if (!blocks) break
      outline.push(...blocks)
      if (outline.length >= 6) break
    }
  } catch {
    return []
  }
  return outline.slice(0, 6)
}
