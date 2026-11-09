import '../utils/dotenv.js'

import path from 'node:path'
import { ingestMarkdown } from 'docs-search/ingest'

import { ingestReferencePages } from './reference-pages.js'
import { createSupabaseClient, TABLE_NAME } from './supabase.js'

async function main() {
  await ingestMarkdown({
    supabase: createSupabaseClient(),
    table: TABLE_NAME,
    contentRoot: path.resolve(process.cwd(), 'public/markdown'),
    ignore: ['reference/**', 'guides/troubleshooting/**', '_partials/**'],
  })
  // TEMPORARY until reference pages are markdown too; see ./reference-pages.ts to remove.
  await ingestReferencePages({ supabase: createSupabaseClient(), table: TABLE_NAME })
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
