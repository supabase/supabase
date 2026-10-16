import { readFile } from 'node:fs/promises'
import fg from 'fast-glob'

import { filePathToSlug } from './routes.js'
import { buildRows } from './rows.js'
import type { IngestOptions } from './types.js'

const INSERT_BATCH_SIZE = 200

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

  console.log(`Done. Ingested ${totalRows} section(s) from ${files.length} file(s).`)
  return totalRows
}
