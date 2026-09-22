import '../utils/dotenv.js'

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fg from 'fast-glob'

import { parsePage } from './markdown.js'
import { filePathToSlug } from './routes.js'
import { createSupabaseClient, TABLE_NAME } from './supabase.js'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Folder that holds the markdown files. Searched recursively. */
export const CONTENT_ROOT = path.resolve(process.cwd(), 'public/markdown')

/** Glob patterns (relative to CONTENT_ROOT) for the files to ingest. */
const FILE_PATTERNS = ['**/*.md', '**/*.mdx']

/** Glob patterns (relative to CONTENT_ROOT) for files/folders to skip. */
const IGNORED_PATTERNS = ['reference/**', 'guides/troubleshooting/**', '_partials/**']

/** How many rows to send to Supabase per insert request. */
const INSERT_BATCH_SIZE = 200

// ---------------------------------------------------------------------------

interface SectionRow {
  slug: string
  file_path: string
  page_title: string
  heading: string
  heading_level: number
  heading_path: string[]
  content: string
  excerpt: string
}

/** Build the DB rows for a single markdown file. Pure: no I/O. */
export function buildRows(markdown: string, filePath: string, contentRoot: string): SectionRow[] {
  const slug = filePathToSlug(filePath, contentRoot)
  const relativePath = path.relative(contentRoot, filePath).split(path.sep).join('/')
  const page = parsePage(markdown)
  const pageTitle = page.title || path.basename(slug) || 'Untitled'

  return page.sections.map((section) => ({
    slug,
    file_path: relativePath,
    page_title: pageTitle,
    heading: section.heading,
    heading_level: section.level,
    heading_path: section.headingPath,
    content: section.content,
    excerpt: page.excerpt,
  }))
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

async function main() {
  const supabase = createSupabaseClient()

  const files = await fg(FILE_PATTERNS, {
    cwd: CONTENT_ROOT,
    absolute: true,
    onlyFiles: true,
    ignore: IGNORED_PATTERNS,
  })
  if (files.length === 0) {
    console.warn(`No markdown files found under ${CONTENT_ROOT}`)
    return
  }
  console.log(`Found ${files.length} markdown file(s) under ${CONTENT_ROOT}`)

  let totalRows = 0

  for (const file of files.sort()) {
    const markdown = await readFile(file, 'utf8')
    const rows = buildRows(markdown, file, CONTENT_ROOT)
    const slug = rows[0]?.slug ?? filePathToSlug(file, CONTENT_ROOT)

    // Replace everything previously ingested for this page.
    const { error: deleteError } = await supabase.from(TABLE_NAME).delete().eq('slug', slug)
    if (deleteError) throw new Error(`Failed to clear "${slug}": ${deleteError.message}`)

    for (const batch of chunk(rows, INSERT_BATCH_SIZE)) {
      const { error: insertError } = await supabase.from(TABLE_NAME).insert(batch)
      if (insertError) throw new Error(`Failed to insert "${slug}": ${insertError.message}`)
    }

    totalRows += rows.length
    console.log(`  ✓ ${slug || '(root)'}  (${rows.length} section${rows.length === 1 ? '' : 's'})`)
  }

  console.log(`Done. Ingested ${totalRows} section(s) from ${files.length} file(s).`)
}

// Only run when executed directly (so buildRows can be imported by tests).
const isDirectRun =
  !!process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isDirectRun) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
