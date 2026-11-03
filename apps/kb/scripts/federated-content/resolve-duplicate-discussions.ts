// One-off, run locally, NOT committed. Resolves the guides that the entries
// sync blocked because they already have SEVERAL discussions and no
// troubleshooting_entries row referencing any of them.
//
// For each hardcoded slug below it inserts ONE row, pointing at the discussion
// that was CREATED FIRST (slug, github_id, github_url, checksum). The other
// discussions are NOT deleted or modified in any way; they are listed at the
// end so they can be dealt with by hand.
//
// The list is hardcoded on purpose: only these slugs are ever touched. Nothing
// is inferred from titles.
//
// Everything is re-verified live before a slug is touched, and a slug that
// fails any check is skipped and reported (the others still run):
//   - every discussion exists, is in the supabase/supabase Troubleshooting
//     category, and its title equals the local guide's title,
//   - the slug has a local guide,
//   - no row has this slug, and no row references any of these discussions.
//
// checksum: stored as the local guide's checksum only if the kept
// discussion's body already equals the guide's body (line endings and
// surrounding whitespace ignored). Otherwise it is left NULL, which makes
// sync-troubleshooting-updates.ts push the current content to that discussion
// on its next run.
//
// This script only reads from GitHub and only writes to the database.
// --dry-run is read-only: it fetches and verifies everything and prints the
// plan, but inserts nothing.
//
// Usage (from apps/kb, same env as the sync scripts):
//   ./node_modules/.bin/tsx scripts/federated-content/resolve-duplicate-discussions.ts --dry-run
//   ./node_modules/.bin/tsx scripts/federated-content/resolve-duplicate-discussions.ts
import '../utils/dotenv.js'

import {
  computeChecksum,
  createDb,
  createOctokit,
  fetchAllEntries,
  readLocalGuides,
  REPOSITORY_ID,
  TROUBLESHOOTING_CATEGORY_ID,
  type RetryOctokitInstance,
} from './troubleshooting-sync-shared.ts'

const DRY_RUN = process.argv.includes('--dry-run')

// Discussion numbers in supabase/supabase (github.com/orgs/supabase/discussions/<n>).
const DUPLICATES: Array<{ slug: string; discussions: number[] }> = [
  { slug: 'edge-function-error-rate-limit-exceeded-for-trace-1094d3', discussions: [45875, 45796] },
  { slug: 'kong-stops-responding-under-heavy-load-locally', discussions: [48462, 47239] },
  { slug: 'realtime-postgres-changes-troubleshooting', discussions: [50761, 49604] },
  {
    slug: 'resolving-cannot-execute-update-in-a-read-only-transaction-on-transaction-pooler-connections-ef582c',
    discussions: [48550, 44988],
  },
  { slug: 'schema-pg_pgrst_no_exposed_schemas-does-not-exist', discussions: [49002, 48659, 45144] },
  {
    slug: 'supavisor-error-circuit-breaker-open-after-password-rotation-0fdb72',
    discussions: [50259, 45688],
  },
  {
    slug: 'troubleshooting-connect_timeout-or-hanging-queries-in-vercel-serverless-functions-775f92',
    discussions: [47051, 46739],
  },
  {
    slug: 'vercel-integration-environment-variables-not-syncing-for-persistent-git-branches-b9191e',
    discussions: [48552, 44989],
  },
]

type Discussion = {
  id: string
  number: number
  url: string
  title: string
  body: string
  createdAt: string
  category: { id: string }
  repository: { id: string }
}

type Plan = { slug: string; keep: Discussion; leftover: Discussion[]; checksum: string | null }

async function fetchDiscussion(
  octokit: RetryOctokitInstance,
  number: number
): Promise<Discussion | null> {
  const { repository } = await octokit.graphql<{
    repository: { discussion: Discussion | null } | null
  }>(
    `query ($number: Int!) {
       repository(owner: "supabase", name: "supabase") {
         discussion(number: $number) {
           id number url title body createdAt
           category { id }
           repository { id }
         }
       }
     }`,
    { number }
  )
  return repository?.discussion ?? null
}

const normalize = (text: string) => text.replace(/\r\n/g, '\n').trim()
const sameTitle = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
const describe = (d: Discussion) => `#${d.number} created ${d.createdAt}`

async function resolveDuplicateDiscussions() {
  const db = createDb()
  const octokit = createOctokit()

  const guides = new Map((await readLocalGuides()).map((guide) => [guide.slug, guide]))
  const entries = await fetchAllEntries(db)

  console.log(
    `[resolve-duplicate-discussions] ${DUPLICATES.length} slug(s)${DRY_RUN ? ' (dry run)' : ''}.`
  )

  // Phase 1 (read-only): fetch and verify; build a plan per slug.
  const plans: Plan[] = []
  const problems: Array<{ slug: string; reason: string }> = []

  for (const { slug, discussions: numbers } of DUPLICATES) {
    try {
      const guide = guides.get(slug)
      if (!guide) throw new Error('no local guide with this exact slug (run the fetch first?)')

      const rowForSlug = entries.find((entry) => entry.slug === slug)
      if (rowForSlug) throw new Error(`row ${rowForSlug.id} already has this slug`)

      const fetched = await Promise.all(numbers.map((n) => fetchDiscussion(octokit, n)))
      const missing = numbers.filter((_, i) => !fetched[i])
      if (missing.length > 0) {
        throw new Error(`discussion(s) not found: ${missing.map((n) => `#${n}`).join(', ')}`)
      }
      const discussions = fetched as Discussion[]

      for (const d of discussions) {
        if (d.repository.id !== REPOSITORY_ID) {
          throw new Error(`#${d.number} is not in supabase/supabase`)
        }
        if (d.category.id !== TROUBLESHOOTING_CATEGORY_ID) {
          throw new Error(`#${d.number} is not in the Troubleshooting category`)
        }
        if (!sameTitle(d.title, guide.title)) {
          throw new Error(
            `#${d.number} title "${d.title}" does not match the guide's "${guide.title}"`
          )
        }
        const referencedBy = entries.find((entry) => entry.github_id === d.id)
        if (referencedBy) {
          throw new Error(
            `#${d.number} is already referenced by row ${referencedBy.id} (slug ${referencedBy.slug ?? 'null'})`
          )
        }
      }

      // Earliest created is kept; the discussion number breaks an exact tie.
      const sorted = [...discussions].sort(
        (a, b) => a.createdAt.localeCompare(b.createdAt) || a.number - b.number
      )
      const [keep, ...leftover] = sorted
      const inSync = normalize(keep.body) === normalize(guide.body)
      plans.push({
        slug,
        keep,
        leftover,
        checksum: inSync ? computeChecksum(guide.title, guide.body) : null,
      })
    } catch (error) {
      problems.push({ slug, reason: error instanceof Error ? error.message : String(error) })
    }
  }

  for (const { slug, keep, leftover, checksum } of plans) {
    console.log(`\n  ${slug}`)
    console.log(`    KEEP   ${describe(keep)} ${keep.url}`)
    console.log(
      `           INSERT row { slug, github_id: ${keep.id}, github_url: ${keep.url}, ` +
        `checksum: ${checksum ?? 'null (kept discussion body differs from the guide; updates sync will refresh it)'} }`
    )
    for (const d of leftover) console.log(`    LEAVE  ${describe(d)} ${d.url}  (not touched)`)
  }

  // Phase 2: write (skipped on a dry run).
  const failures: Array<{ slug: string; reason: string }> = []
  let rowsInserted = 0

  if (!DRY_RUN) {
    for (const { slug, keep, checksum } of plans) {
      const { error } = await db.from('troubleshooting_entries').insert({
        slug,
        github_id: keep.id,
        github_url: keep.url,
        checksum,
      })
      if (error) failures.push({ slug, reason: `row insert failed: ${error.message}` })
      else rowsInserted++
    }
  }

  const inserted = new Set(
    DRY_RUN
      ? plans.map((plan) => plan.slug)
      : plans.map((plan) => plan.slug).filter((s) => !failures.some((f) => f.slug === s))
  )
  const leftovers = plans.filter((plan) => inserted.has(plan.slug)).flatMap((plan) => plan.leftover)

  console.log(
    `\n[resolve-duplicate-discussions] ${DRY_RUN ? 'Would insert' : 'Inserted'} ` +
      `${DRY_RUN ? plans.length : rowsInserted} row(s); ${problems.length} slug(s) skipped, ` +
      `${failures.length} failure(s). No discussion was deleted or modified.`
  )

  if (leftovers.length > 0) {
    console.log(
      `\n${leftovers.length} duplicate discussion(s) left in place (no row references them):`
    )
    for (const d of leftovers) console.log(`  - ${d.url}`)
  }

  const attention = [...problems, ...failures]
  if (attention.length > 0) {
    console.error(`\nNeeds manual attention (${attention.length}):`)
    for (const { slug, reason } of attention) console.error(`  - ${slug}\n    ${reason}`)
    process.exitCode = 1
  }
}

resolveDuplicateDiscussions().catch((error) => {
  console.error(error)
  process.exit(1)
})
