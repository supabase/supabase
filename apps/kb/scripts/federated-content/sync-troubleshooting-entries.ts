// Creates a GitHub Discussion for every guide with no troubleshooting_entries
// row yet, and inserts the row (slug, github_id, github_url, checksum). Guides
// are matched to rows by exact slug. Run after fetch-federated-content.ts,
// from CI only.
//
// Duplicate guards:
//   - A new guide whose title already belongs to an unreferenced discussion,
//     or to a slug-less row, is reported instead of created.
//   - The row is inserted, not upserted: if it already exists (e.g. an
//     overlapping run), the new discussion is deleted again.
//   - Creations are paced (2s apart, `--delay-ms=<n>`) and never retried, since
//     a retry after a timeout could create a second discussion. On a GitHub
//     rate limit the run stops and the next run resumes.
//
// --dry-run is read-only: prints what it would create and insert, writes nothing.
import '../utils/dotenv.js'

import type { SupabaseClient } from '@supabase/supabase-js'

import { createPacer, isRateLimitError, readMinIntervalMs } from './github-throttle.ts'
import {
  computeChecksum,
  createDb,
  createOctokit,
  describeConflict,
  fetchAllEntries,
  findTitleConflicts,
  isBlocking,
  listCategoryDiscussions,
  readLocalGuides,
  REPOSITORY_ID,
  TROUBLESHOOTING_CATEGORY_ID,
  type EntryRow,
  type LocalGuide,
  type RetryOctokitInstance,
} from './troubleshooting-sync-shared.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const LOG = '[sync-troubleshooting-entries]'

async function createDiscussion(
  octokit: RetryOctokitInstance,
  title: string,
  body: string
): Promise<{ id: string; url: string }> {
  const mutation = `
    mutation CreateDiscussionMutation($repository: ID!, $category: ID!, $title: String!, $body: String!) {
      createDiscussion(input: { repositoryId: $repository, categoryId: $category, title: $title, body: $body }) {
        discussion { id url }
      }
    }
  `
  // retries: 0 disables @octokit/plugin-retry, which would re-send on a 5xx.
  const result = await octokit.graphql<{
    createDiscussion: { discussion: { id: string; url: string } }
  }>(mutation, {
    repository: REPOSITORY_ID,
    category: TROUBLESHOOTING_CATEGORY_ID,
    title,
    body,
    request: { retries: 0 },
  })
  return result.createDiscussion.discussion
}

async function deleteDiscussion(octokit: RetryOctokitInstance, id: string): Promise<void> {
  // DeleteDiscussionInput takes `id` (UpdateDiscussionInput is the one with `discussionId`).
  const mutation = `
    mutation DeleteDiscussionMutation($id: ID!) {
      deleteDiscussion(input: { id: $id }) { discussion { id } }
    }
  `
  await octokit.graphql(mutation, { id, request: { retries: 0 } })
}

async function createGuide(
  db: SupabaseClient,
  octokit: RetryOctokitInstance,
  guide: LocalGuide,
  existingRow: EntryRow | undefined,
  pace: () => Promise<void>
): Promise<void> {
  // Sent once: if a timeout hid a success, the next run's title check flags it.
  await pace()
  const discussion = await createDiscussion(octokit, guide.title, guide.body)
  const row = {
    slug: guide.slug,
    github_url: discussion.url,
    github_id: discussion.id,
    checksum: computeChecksum(guide.title, guide.body),
  }

  // An existing row here has an empty github_id; fill it in place.
  const { error } = existingRow
    ? await db.from('troubleshooting_entries').update(row).eq('id', existingRow.id)
    : await db.from('troubleshooting_entries').insert(row)

  if (error) {
    console.error(`${LOG} DB write failed for ${guide.slug}, rolling back discussion`)
    try {
      await pace()
      await deleteDiscussion(octokit, discussion.id)
    } catch (rollbackError) {
      console.error(
        `${LOG} ROLLBACK FAILED for ${guide.slug}: discussion ${discussion.url} is orphaned, delete it manually.`,
        rollbackError
      )
    }
    throw error
  }
  console.log(`  - created ${guide.slug} -> ${discussion.url}`)
}

function printDryRunGuide(guide: LocalGuide, existingRow: EntryRow | undefined) {
  const checksum = computeChecksum(guide.title, guide.body)
  console.log(`  + ${guide.slug}`)
  console.log(`      title:       ${guide.title}`)
  console.log(
    `      discussion:  CREATE in the Troubleshooting category (${guide.body.length} chars of body)`
  )
  console.log(
    `      row:         ${existingRow ? `UPDATE row ${existingRow.id}` : 'INSERT'} ` +
      `{ slug: "${guide.slug}", github_id: <assigned by GitHub>, github_url: <assigned by GitHub>, checksum: ${checksum} }`
  )
}

async function syncNewDiscussions() {
  const guides = await readLocalGuides()
  const db = createDb()
  const octokit = createOctokit()
  const entries = await fetchAllEntries(db)

  const entryBySlug = new Map<string, EntryRow>()
  for (const entry of entries) if (entry.slug) entryBySlug.set(entry.slug, entry)
  const localSlugs = new Set(guides.map((guide) => guide.slug))
  const sluglessRows = entries.filter((entry) => !entry.slug)
  const rowsWithoutGuide = entries.filter((entry) => entry.slug && !localSlugs.has(entry.slug))

  // New = no row for this slug with a discussion.
  const newGuides = guides.filter((guide) => !entryBySlug.get(guide.slug)?.github_id)

  console.log(
    `${LOG} ${guides.length} local guide(s), ${entries.length} row(s)${DRY_RUN ? ' (dry run)' : ''}: ` +
      `${guides.length - newGuides.length} already synced, ${newGuides.length} new.`
  )
  if (sluglessRows.length > 0) {
    console.warn(
      `${LOG} ${sluglessRows.length} row(s) have no slug, so no guide can match them` +
        `${DRY_RUN ? ':' : '.'} (a guide for one of them would look new — see the duplicate check below)`
    )
    if (DRY_RUN)
      for (const row of sluglessRows) console.warn(`      - row ${row.id} ${row.github_url}`)
  }
  if (DRY_RUN && rowsWithoutGuide.length > 0) {
    console.log(
      `${LOG} ${rowsWithoutGuide.length} row(s) have a slug but no local guide (untouched):`
    )
    for (const row of rowsWithoutGuide) console.log(`      - ${row.slug}`)
  }

  if (newGuides.length === 0) {
    console.log(`${LOG} No new troubleshooting guides to sync.`)
    return
  }

  // Read-only. If it fails nothing is created: duplicates can't be ruled out.
  const discussions = await listCategoryDiscussions(octokit)

  const blocked: Array<{ slug: string; reasons: string[] }> = []
  const failures: string[] = []
  const notAttempted: string[] = []
  let created = 0

  const minIntervalMs = readMinIntervalMs()
  const pace = createPacer(minIntervalMs)
  let rateLimited = false

  console.log(`\n${LOG} New guide(s):`)
  if (DRY_RUN) {
    console.log(
      `  (pacing: at least ${minIntervalMs}ms between creations; a failed creation is not retried)`
    )
  }
  for (const guide of newGuides) {
    // After a rate limit the next calls would fail too: stop, next run resumes.
    if (rateLimited) {
      notAttempted.push(guide.slug)
      continue
    }

    const conflicts = findTitleConflicts(guide.title, discussions, entries)
    const blockers = conflicts.filter(isBlocking)

    if (blockers.length > 0) {
      const reasons = blockers.map(describeConflict)
      blocked.push({ slug: guide.slug, reasons })
      console.error(`  ! ${guide.slug} — NOT created, would duplicate an existing discussion:`)
      for (const reason of reasons) console.error(`      ${reason}`)
      continue
    }

    const existingRow = entryBySlug.get(guide.slug)
    if (DRY_RUN) {
      printDryRunGuide(guide, existingRow)
      for (const c of conflicts) console.warn(`      warning:     ${describeConflict(c)}`)
      created++
      continue
    }

    for (const c of conflicts) console.warn(`  ? ${guide.slug}: ${describeConflict(c)}`)
    try {
      await createGuide(db, octokit, guide, existingRow, pace)
      created++
    } catch (error) {
      console.error(`${LOG} Failed for ${guide.slug}:`, error)
      failures.push(guide.slug)
      if (isRateLimitError(error)) rateLimited = true
    }
  }

  console.log(
    `\n${LOG} ${DRY_RUN ? 'Would create' : 'Created'} ${created}/${newGuides.length} new guide(s) ` +
      `(a discussion and a row each); ${blocked.length} blocked as duplicates, ${failures.length} failed.`
  )

  if (notAttempted.length > 0) {
    console.error(
      `${LOG} Stopped early: GitHub rate-limited the request. ${notAttempted.length} guide(s) were not attempted ` +
        `and will be picked up by the next run (or raise --delay-ms): ${notAttempted.join(', ')}`
    )
    process.exitCode = 1
  }

  if (blocked.length > 0 || failures.length > 0) {
    if (blocked.length > 0) {
      console.error(`${LOG} Blocked (fix the existing row's slug, then re-run):`)
      for (const { slug, reasons } of blocked) console.error(`  - ${slug}`, reasons.join('\n'))
    }
    if (failures.length > 0) console.error(`${LOG} Failed: ${failures.join(', ')}`)
    process.exitCode = 1
  }
}

syncNewDiscussions().catch((error) => {
  console.error(error)
  process.exit(1)
})
