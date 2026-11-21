import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

import { toContentId } from './content-id'
import { toIsoDay } from './format-date'
import { KB_BASE_URL } from './json-ld'
import { getEntryMetadataBySlug } from './troubleshooting-db'

const CONTENT_DIR = fileURLToPath(new URL('../content', import.meta.url))
const COLLECTIONS = ['guides', 'faqs', 'troubleshooting'] as const

// Missing folders (troubleshooting is fetched at prebuild) read as empty.
async function listArticles() {
  return (
    await Promise.all(
      COLLECTIONS.map(async (collection) => {
        const files = await readdir(path.join(CONTENT_DIR, collection), { recursive: true }).catch(
          () => []
        )
        return files
          .filter((file) => /\.mdx?$/.test(file))
          .map((file) => ({ collection, file, id: toContentId(file) }))
      })
    )
  ).flat()
}

/**
 * Sitemap `lastmod` (YYYY-MM-DD) for each article URL. Guides and FAQs use their
 * `lastEdited` frontmatter; troubleshooting uses `date_updated` from one database
 * query. URLs without a date are left out rather than given the build date.
 */
export async function getSitemapLastmods(): Promise<Map<string, string>> {
  const articles = await listArticles()

  const troubleshootingIds = articles
    .filter((article) => article.collection === 'troubleshooting')
    .map((article) => article.id)
  const dbMetadata =
    troubleshootingIds.length > 0
      ? await getEntryMetadataBySlug(troubleshootingIds)
      : new Map<string, { dateUpdated?: Date }>()

  const withDates = await Promise.all(
    articles.map(async (article) => {
      if (article.collection === 'troubleshooting') {
        return { ...article, lastEdited: dbMetadata.get(article.id)?.dateUpdated }
      }
      const { data } = matter(
        await readFile(path.join(CONTENT_DIR, article.collection, article.file), 'utf-8')
      )
      return {
        ...article,
        lastEdited: data.lastEdited instanceof Date ? data.lastEdited : undefined,
      }
    })
  )

  return new Map(
    withDates.flatMap(({ collection, id, lastEdited }) =>
      lastEdited ? [[`${KB_BASE_URL}/${collection}/${id}`, toIsoDay(lastEdited)] as const] : []
    )
  )
}
