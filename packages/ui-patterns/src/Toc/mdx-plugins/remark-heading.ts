import Slugger from 'github-slugger'
import type { Heading, Root } from 'mdast'
import type { Data, Transformer } from 'unified'
import { visit } from 'unist-util-visit'
import type { VFile } from 'vfile'

import type { TOCItemType } from '../types'
import { flattenNode } from './remark-utils'

const slugger = new Slugger()

declare module 'mdast' {
  export interface HeadingData extends Data {
    hProperties?: {
      id?: string
    }
  }
}

const regex = /\s*\[#([^]+?)]\s*$/

export interface RemarkHeadingOptions {
  slug?: (root: Root, heading: Heading, text: string) => string

  /**
   * Allow custom headings ids
   *
   * @defaultValue true
   */
  customId?: boolean

  /**
   * Attach an array of `TOCItemType` to `file.data.toc`
   *
   * @defaultValue true
   */
  generateToc?: boolean
}

/**
 * Add heading ids and extract TOC
 */
export function remarkHeading({
  slug: defaultSlug,
  customId = true,
  generateToc = true,
}: RemarkHeadingOptions = {}): Transformer<Root, Root> {
  return (root: Root, file: VFile) => {
    const toc: TOCItemType[] = []
    slugger.reset()

    visit(root, 'heading', (heading: any) => {
      heading.data ||= {}
      heading.data.hProperties ||= {}

      let id = heading.data.hProperties.id
      const lastNode = heading.children.at(-1)

      if (!id && lastNode?.type === 'text' && customId) {
        const match = regex.exec(lastNode.value)

        if (match?.[1]) {
          id = match[1]
          lastNode.value = lastNode.value.slice(0, match.index)
        }
      }

      let flattened: string | undefined
      if (!id) {
        flattened ??= flattenNode(heading)

        id = defaultSlug ? defaultSlug(root, heading, flattened) : slugger.slug(flattened)
      }

      heading.data.hProperties.id = id

      if (generateToc) {
        toc.push({
          title: flattened ?? flattenNode(heading),
          url: `#${id}`,
          depth: heading.depth,
        })
      }

      return 'skip'
    })

    if (generateToc) file.data.toc = toc
  }
}
