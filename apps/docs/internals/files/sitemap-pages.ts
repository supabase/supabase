import fs from 'fs'
import { globby } from 'globby'
import matter from 'gray-matter'
import { checkGuidePageEnabled } from '~/features/docs/NavigationPageStatus.utils'

import { generateReferencePages } from './reference-lib'

export interface SitemapPage {
  link: string
  priority: number
  title: string
  /** Set only on reference pages from an older SDK version. */
  version?: string
}

export async function getSitemapPages(): Promise<SitemapPage[]> {
  const referencePages = await generateReferencePages()

  const contentFiles = await globby(['content/guides/**/!(_)*.mdx'])
  const contentPages = await Promise.all(
    contentFiles.map(async (filePath) => {
      const fileContents = await fs.promises.readFile(filePath, 'utf8')
      const {
        data: { sitemapPriority, title },
      } = matter(fileContents)
      const link = filePath.replace(/^content\//, '').replace(/\.mdx$/, '')

      return {
        link,
        priority: sitemapPriority ?? 0.8,
        title: typeof title === 'string' && title ? title : link.split('/').at(-1)!,
      }
    })
  )

  const allPages = (contentPages as Array<SitemapPage>)
    .filter(({ link }) => checkGuidePageEnabled(`/${link}`))
    .concat(referencePages)
  // Keep the output order stable across builds
  allPages.sort((a, b) => (a.link < b.link ? -1 : a.link > b.link ? 1 : 0))

  return allPages
}
