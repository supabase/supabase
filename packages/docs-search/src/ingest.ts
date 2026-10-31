import { readFile } from 'node:fs/promises'
import fg from 'fast-glob'

import { filePathToSlug } from './routes.js'
import { buildRows } from './rows.js'
import type { IngestOptions } from './types.js'

const INSERT_BATCH_SIZE = 200

// Rows are stamped by the database clock and the cutoff by ours, so keep a margin before treating
// a row as untouched. Too small and a fresh row could be removed, too large only delays cleanup.
// 25 * 60 * 60 * 1000 is 25 hours in milliseconds: the nightly ingest cron interval plus an hour of
// slack for run drift and clock skew. Only rows left over from a run more than 25 hours old are
// removed.
const STALE_AFTER_MS = 25 * 60 * 60 * 1000

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

export async function ingestMarkdown({
  supabase,
  contentRoot,
  include = ['**/*.md', '**/*.mdx'],
  ignore = [],
  table,
  slugPrefix = '',
}: IngestOptions): Promise<number> {
  const files = await fg(include, { cwd: contentRoot, absolute: true, onlyFiles: true, ignore })
  if (files.length === 0) {
    console.warn(`No markdown files found under ${contentRoot}`)
    return 0
  }
  console.log(`Found ${files.length} markdown file(s) under ${contentRoot}`)

  const startedAt = Date.now()
  let totalRows = 0

  for (const file of files.sort()) {
    const markdown = await readFile(file, 'utf8')
    const rows = buildRows(markdown, file, contentRoot, slugPrefix)
    const slug = rows[0]?.slug ?? slugPrefix + filePathToSlug(file, contentRoot)

    const { error: deleteError } = await supabase.from(table).delete().eq('slug', slug)
    if (deleteError) throw new Error(`Failed to clear "${slug}": ${deleteError.message}`)

    for (const batch of chunk(rows, INSERT_BATCH_SIZE)) {
      const { error: insertError } = await supabase.from(table).insert(batch)
      if (insertError) throw new Error(`Failed to insert "${slug}": ${insertError.message}`)
    }

    totalRows += rows.length
    console.log(`  ✓ ${slug || '(root)'}  (${rows.length} section${rows.length === 1 ? '' : 's'})`)
  }

  // Every ingested page was re-inserted above, so rows that weren't touched belong to pages that
  // were deleted, renamed or are now ignored. Scoped to the slug prefix so other sources sharing
  // the table are left alone.
  const cutoff = new Date(startedAt - STALE_AFTER_MS).toISOString()
  let staleQuery = supabase.from(table).delete().lt('updated_at', cutoff)
  if (slugPrefix) staleQuery = staleQuery.like('slug', `${escapeLike(slugPrefix)}%`)
  const { data: removed, error: cleanupError } = await staleQuery.select('slug')
  if (cleanupError) throw new Error(`Failed to remove stale pages: ${cleanupError.message}`)
  const removedSlugs = [...new Set((removed ?? []).map(({ slug }) => slug))]
  for (const slug of removedSlugs)
    console.log(`  ✗ ${slug || '(root)'}  (removed, no longer in content)`)

  console.log(`Done. Ingested ${totalRows} section(s) from ${files.length} file(s).`)
  return totalRows
}
