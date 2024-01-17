/**
 * Migration script to migrate the Markdown contents from the database into GitHub
 * Keeping this because we haven't migrated the unapproved ones yet
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

dotenv.config({ path: '.env.local' })

const CONTENT_DIR = join(dirname(fileURLToPath(import.meta.url)), 'content')

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_MISC_USE_URL,
    process.env.NEXT_PUBLIC_MISC_USE_ANON_KEY
  )

  const { data: partners, error } = await supabase
    .from('partners')
    .select('slug,overview')
    .eq('approved', true)

  if (error || !partners) {
    console.error("Didn't fetch any data:", error)
  }

  try {
    await Promise.all(
      partners.map((partner) => {
        writeFile(join(CONTENT_DIR, `${partner.slug}.mdx`), partner.overview)
      })
    )
  } catch (err) {
    console.error(err)
  }
}

main()
