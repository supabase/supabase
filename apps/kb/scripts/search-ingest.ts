import './utils/dotenv.js'

import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { ingestMarkdown } from 'docs-search/ingest'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set them in .env.local.')
  process.exit(1)
}

ingestMarkdown({
  supabase: createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  }),
  table: 'kb_search_sections',
  contentRoot: path.resolve(process.cwd(), 'public/markdown'),
  include: ['troubleshooting/**/*.md'],
  slugPrefix: 'kb/',
}).catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
