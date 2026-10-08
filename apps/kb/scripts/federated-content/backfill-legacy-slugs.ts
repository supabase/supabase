// One-time migration aid: troubleshooting_entries has 278 rows pre-dating kb
// (apps/docs' own discussions), all with slug = NULL. legacy-troubleshooting-slugs.json
// maps each row's id (docs' own `database_id` frontmatter field) to the slug
// of the docs content file it came from, extracted once from
// apps/docs/content/troubleshooting/*.mdx (that content isn't checked out by
// this workflow and doesn't need to be — these ids never change).
//
// Stored as the bare slug, not prefixed: as these files get migrated into the
// federated supabase/troubleshooting repo under the same slug, sync-troubleshooting-entries.ts
// needs to match them by slug against these rows' existing github_url — otherwise
// it treats the guide as new and creates a duplicate discussion, orphaning the
// original (with its comments and links).
//
// Delete this file, legacy-troubleshooting-slugs.json, its package.json script,
// and its workflow step once all legacy rows are backfilled — safe to remove
// as a unit, nothing else depends on it.
import '../utils/dotenv.js'

import { createClient } from '@supabase/supabase-js'

import legacySlugs from './legacy-troubleshooting-slugs.json' with { type: 'json' }

const DRY_RUN = process.argv.includes('--dry-run')

async function backfillLegacySlugs() {
  if (DRY_RUN) {
    for (const [databaseId, slug] of Object.entries(legacySlugs)) {
      console.log(`  - ${databaseId} -> ${slug}`)
    }
    return
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  let backfilled = 0
  let alreadyDone = 0

  for (const [databaseId, slug] of Object.entries(legacySlugs)) {
    // .is('slug', null) makes this idempotent/concurrency-safe: a duplicate
    // run updates 0 rows instead of racing.
    const { data, error } = await db
      .from('troubleshooting_entries')
      .update({ slug })
      .eq('id', databaseId)
      .is('slug', null)
      .select('id')
    if (error) throw error

    if (data.length > 0) backfilled++
    else alreadyDone++
  }

  console.log(
    `[backfill-legacy-slugs] Backfilled ${backfilled}, already done ${alreadyDone}, total ${Object.keys(legacySlugs).length}.`
  )
}

backfillLegacySlugs().catch((error) => {
  throw error
})
