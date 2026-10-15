import '../utils/dotenv.js'

import path from 'node:path'
import { createSearchClient } from 'docs-search'
import { ingestMarkdown } from 'docs-search/src/ingest'

/** Folder that holds the markdown files. Searched recursively. */
const CONTENT_ROOT = path.resolve(process.cwd(), 'public/markdown')

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}. Set it in .env.local.`)
  return value
}

async function main() {
  await ingestMarkdown({
    supabase: createSearchClient(
      `https://${requireEnv('SEARCH_V2_SUPABASE_PROJECT_ID')}.supabase.co`,
      requireEnv('SEARCH_V2_SUPABASE_SECRET_KEY')
    ),
    contentRoot: CONTENT_ROOT,
    ignore: ['reference/**', 'guides/troubleshooting/**', '_partials/**'],
  })
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
