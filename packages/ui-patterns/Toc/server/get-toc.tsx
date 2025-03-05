import { remark } from 'remark'
import { remarkHeading } from '../mdx-plugins/remark-heading'
import type { ReactNode } from 'react'
import type { PluggableList } from 'unified'
import type { Compatible } from 'vfile'

export interface TOCItemType {
  title: ReactNode
  url: string
  depth: number
}

export type TableOfContents = TOCItemType[]

/**
 * Get Table of Contents from markdown/mdx document (using remark)
 *
 * @param content - Markdown content or file
 */
export function getTableOfContents(content: Compatible): TableOfContents

/**
 * Get Table of Contents from markdown/mdx document (using remark)
 *
 * @param content - Markdown content or file
 * @param remarkPlugins - remark plugins to be applied first
 */
export function getTableOfContents(
  content: Compatible,
  remarkPlugins: PluggableList
): Promise<TableOfContents>

export function getTableOfContents(
  content: Compatible,
  remarkPlugins?: PluggableList
): TableOfContents | Promise<TableOfContents> {
  if (remarkPlugins) {
    return remark()
      .use(remarkPlugins as any)
      .use(remarkHeading)
      .process(content)
      .then((result) => {
        if ('toc' in result.data) return result.data.toc as TableOfContents

        return []
      })
  }

  // compatible with previous versions
  const result = remark().use(remarkHeading).processSync(content)

  if ('toc' in result.data) return result.data.toc as TableOfContents

  return []
}
