import { createHash } from 'node:crypto'
import { BaseLoader, BaseSource } from './base.js'
import {
  getAllTroubleshootingEntriesInternal,
  getArticleSlug,
} from '../../../features/docs/Troubleshooting.utils.common.mjs'

/**
 * Represents a troubleshooting article loaded from local MDX files.
 * These articles are stored in `content/troubleshooting/` and provide
 * solutions for common issues users encounter.
 */
interface TroubleshootingEntry {
  /** Absolute path to the MDX file */
  filePath: string
  /** Raw MDX content including JSX components */
  content: string
  /** Markdown content with JSX stripped out (cleaner for embeddings) */
  contentWithoutJsx: string
  /** Frontmatter metadata */
  data: {
    title: string
    topics: string[]
    keywords?: string[]
    /** Unique identifier for this article (used for stable URLs) */
    database_id: string
    /** Original GitHub discussion URL if migrated from discussions */
    github_url?: string
    date_created?: Date
  }
}

/**
 * Loader for troubleshooting articles from local MDX files.
 *
 * The path format is `/guides/troubleshooting/{slug}` where slug is derived
 * from the filename (e.g., `auth-error-handling.mdx` → `auth-error-handling`).
 */
export class TroubleshootingLoader extends BaseLoader {
  type = 'troubleshooting' as const

  constructor(
    source: string,
    public entry: TroubleshootingEntry
  ) {
    const slug = getArticleSlug(entry)
    super(source, `/guides/troubleshooting/${slug}`)
  }

  async load() {
    return [new TroubleshootingSource(this.source, this.path, this.entry)]
  }
}

/**
 * Search source for a single troubleshooting article.
 *
 * Each article becomes one indexed page with a single section containing
 * the full content. This differs from guide pages which may have multiple
 * sections based on headings.
 */
export class TroubleshootingSource extends BaseSource {
  type = 'troubleshooting' as const

  constructor(
    source: string,
    path: string,
    public entry: TroubleshootingEntry
  ) {
    super(source, path)
  }

  async process() {
    const { title, topics, keywords } = this.entry.data
    const content = this.entry.contentWithoutJsx

    // Include title and metadata in checksum so any changes trigger re-indexing.
    // This ensures updates to title, topics, or keywords are picked up even if
    // the main content hasn't changed.
    const checksum = createHash('sha256')
      .update(JSON.stringify({ title, topics, keywords, content }))
      .digest('base64')

    const meta = { title, topics, keywords }

    // Troubleshooting articles are single-section pages (no sub-headings indexed).
    // We explicitly set slug to undefined so the database's `get_full_content_url`
    // function returns the page URL without a fragment (e.g., no trailing `#slug`).
    // This is handled in SQL: `CASE WHEN slug IS NULL THEN '' ELSE concat('#', slug) END`
    const sections = [
      {
        heading: title,
        slug: undefined as string | undefined,
        content: `# ${title}\n${content}`,
      },
    ]

    this.checksum = checksum
    this.meta = meta
    this.sections = sections

    return { checksum, meta, sections }
  }

  /**
   * Returns the full article content formatted for full-text search indexing.
   * The title is included as a heading to boost its relevance in search results.
   */
  extractIndexedContent(): string {
    return `# ${this.entry.data.title}\n\n${this.entry.contentWithoutJsx}`
  }
}

/**
 * Loads all troubleshooting articles from `content/troubleshooting/` directory.
 *
 * Each MDX file is parsed, validated, and converted to a TroubleshootingLoader.
 * Hidden files (prefixed with `_`) are excluded.
 *
 * @returns Array of loaders, one per troubleshooting article
 */
export async function fetchTroubleshootingSources(): Promise<TroubleshootingLoader[]> {
  const entries = (await getAllTroubleshootingEntriesInternal()) as TroubleshootingEntry[]
  return entries.map((entry) => new TroubleshootingLoader('troubleshooting', entry))
}
