// Creates a GitHub Discussion for every troubleshooting guide that doesn't
// have a troubleshooting_entries row yet, and inserts the row (slug,
// github_id, github_url, checksum). Run after fetch-federated-content.ts, from
// CI only (never kb's own prebuild — this has real side effects).
//
// A guide is matched to its row by exact slug (the file name without its
// extension, hash suffix included). Matching rows are never touched here; the
// checksum comparison for those lives in sync-troubleshooting-updates.ts.
//
// Guarding against duplicate discussions:
//   - Before creating anything, the Troubleshooting category's existing
//     discussions are listed. A new guide whose title already belongs to a
//     discussion nothing references (an orphan), or to a slug-less row, is
//     NOT created and is reported instead: that discussion already exists,
//     the row just needs its slug fixed.
//   - The row is INSERTed, never upserted. If a row for the slug appeared in
//     the meantime (e.g. an overlapping run), the insert fails on the unique
//     constraint and the discussion just created is deleted again, instead of
//     silently overwriting the other run's row and orphaning its discussion.
//   - Discussions are created one at a time (GitHub asks for serial mutations).
//
// --dry-run is read-only: it reads the database, the local guides and the
// category's discussions, runs every check, and prints exactly what it would
// create and insert, but creates and writes nothing.
import '../utils/dotenv.js'

import type { SupabaseClient } from '@supabase/supabase-js'

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
  const result = await octokit.graphql<{
    createDiscussion: { discussion: { id: string; url: string } }
  }>(mutation, { repository: REPOSITORY_ID, category: TROUBLESHOOTING_CATEGORY_ID, title, body })
  return result.createDiscussion.discussion
}

async function deleteDiscussion(octokit: RetryOctokitInstance, id: string): Promise<void> {
  const mutation = `
    mutation DeleteDiscussionMutation($discussionId: ID!) {
      deleteDiscussion(input: { discussionId: $discussionId }) { discussion { id } }
    }
  `
  await octokit.graphql(mutation, { discussionId: id })
}

async function createGuide(
  db: SupabaseClient,
  octokit: RetryOctokitInstance,
  guide: LocalGuide,
  existingRow: EntryRow | undefined
): Promise<void> {
  const discussion = await createDiscussion(octokit, guide.title, guide.body)
  const row = {
    slug: guide.slug,
    github_url: discussion.url,
    github_id: discussion.id,
    checksum: computeChecksum(guide.title, guide.body),
  }

  // A row can only already exist here with an empty github_id; fill it in place.
  const { error } = existingRow
    ? await db.from('troubleshooting_entries').update(row).eq('id', existingRow.id)
    : await db.from('troubleshooting_entries').insert(row)

  if (error) {
    console.error(`${LOG} DB write failed for ${guide.slug}, rolling back discussion`)
    try {
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

  // "Already synced" is a row for this slug that has a discussion. Everything
  // else is new.
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

  // Read-only in both modes. If this fails, nothing is created: without it
  // there's no way to rule out duplicating an existing discussion.
  const discussions = await listCategoryDiscussions(octokit)

  const blocked: Array<{ slug: string; reasons: string[] }> = []
  const failures: string[] = []
  let created = 0

  console.log(`\n${LOG} New guide(s):`)
  for (const guide of newGuides) {
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
      await createGuide(db, octokit, guide, existingRow)
      created++
    } catch (error) {
      console.error(`${LOG} Failed for ${guide.slug}:`, error)
      failures.push(guide.slug)
    }
  }

  console.log(
    `\n${LOG} ${DRY_RUN ? 'Would create' : 'Created'} ${created}/${newGuides.length} new guide(s) ` +
      `(a discussion and a row each); ${blocked.length} blocked as duplicates, ${failures.length} failed.`
  )

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
