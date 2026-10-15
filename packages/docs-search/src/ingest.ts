import { readFile } from 'node:fs/promises'
import type { SupabaseClient } from '@supabase/supabase-js'
import fg from 'fast-glob'

import { TABLE_NAME } from './client.js'
import { filePathToSlug } from './routes.js'
import { buildRows } from './rows.js'

const INSERT_BATCH_SIZE = 200

export interface IngestOptions {
  supabase: SupabaseClient
  /** Folder that holds the markdown files. Searched recursively. */
  contentRoot: string
  /** Glob patterns (relative to contentRoot) for the files to ingest. */
  include?: string[]
  /** Glob patterns (relative to contentRoot) for files/folders to skip. */
  ignore?: string[]
  slugPrefix?: string
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
  slugPrefix = '',
}: IngestOptions): Promise<number> {
  const files = await fg(include, { cwd: contentRoot, absolute: true, onlyFiles: true, ignore })
  if (files.length === 0) {
    console.warn(`No markdown files found under ${contentRoot}`)
    return 0
  }
  console.log(`Found ${files.length} markdown file(s) under ${contentRoot}`)

  let totalRows = 0

  for (const file of files.sort()) {
    const markdown = await readFile(file, 'utf8')
    const rows = buildRows(markdown, file, contentRoot, slugPrefix)
    const slug = rows[0]?.slug ?? slugPrefix + filePathToSlug(file, contentRoot)

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
  return totalRows
}
