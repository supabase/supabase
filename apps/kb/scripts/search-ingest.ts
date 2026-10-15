import './utils/dotenv.js'

import path from 'node:path'
import { createSearchClient } from 'docs-search'
import { ingestMarkdown } from 'docs-search/src/ingest'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing ${name}. Set it in .env.local.`)
  return value
}

async function main() {
  await ingestMarkdown({
    supabase: createSearchClient(
      requireEnv('KB_SEARCH_SUPABASE_URL'),
      requireEnv('KB_SEARCH_SUPABASE_SECRET_KEY')
    ),
    contentRoot: path.resolve(process.cwd(), 'public/markdown'),
    include: ['troubleshooting/**/*.md'],
    slugPrefix: 'kb/',
  })
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
