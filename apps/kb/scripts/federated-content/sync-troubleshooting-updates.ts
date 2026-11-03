// Pushes title/content updates to already-synced GitHub Discussions when the
// local troubleshooting guide has changed. Compares the row's stored checksum
// against a freshly computed one — never the discussion's live content — so
// this is immune to whatever GitHub does internally to stored title/body. A
// null checksum always counts as changed. Updates target the discussion
// directly via the row's stored github_id — no need to list/paginate the
// category's discussions.
//
// A guide is matched to its row by exact slug (the file name without its
// extension, hash suffix included), the same key sync-troubleshooting-entries.ts
// uses. A guide with no row is skipped here: that script creates it.
//
// The discussion is updated first and the checksum stored second, so a failed
// DB write only means the next run pushes the same content again (idempotent),
// never that a changed guide is recorded as synced without having been pushed.
//
// Run after sync-troubleshooting-entries.ts, from CI only.
//
// --dry-run is read-only: it reads the database and the local guides, and
// prints each discussion it would update (url, id, and old -> new checksum),
// but updates nothing.
import '../utils/dotenv.js'

import {
  computeChecksum,
  createDb,
  createOctokit,
  fetchAllEntries,
  readLocalGuides,
  type EntryRow,
  type RetryOctokitInstance,
} from './troubleshooting-sync-shared.ts'

const DRY_RUN = process.argv.includes('--dry-run')
const LOG = '[sync-troubleshooting-updates]'

async function updateDiscussion(
  octokit: RetryOctokitInstance,
  discussionId: string,
  title: string,
  body: string
): Promise<void> {
  const mutation = `
    mutation UpdateDiscussionMutation($discussionId: ID!, $title: String!, $body: String!) {
      updateDiscussion(input: { discussionId: $discussionId, title: $title, body: $body }) {
        discussion { id }
      }
    }
  `
  await octokit.graphql(mutation, { discussionId, title, body })
}

async function syncDiscussionUpdates() {
  const guides = await readLocalGuides()
  const db = createDb()
  const octokit = createOctokit()
  const entries = await fetchAllEntries(db)

  const entryBySlug = new Map<string, EntryRow>()
  for (const entry of entries) if (entry.slug) entryBySlug.set(entry.slug, entry)

  let unchanged = 0
  let withoutRow = 0
  let updated = 0
  let noStoredChecksum = 0
  const failures: string[] = []

  console.log(
    `${LOG} ${guides.length} local guide(s), ${entries.length} row(s)${DRY_RUN ? ' (dry run)' : ''}.`
  )

  for (const guide of guides) {
    const row = entryBySlug.get(guide.slug)
    if (!row) {
      withoutRow++ // not synced yet — sync-troubleshooting-entries.ts handles that
      continue
    }

    const newChecksum = computeChecksum(guide.title, guide.body)
    if (row.checksum && row.checksum === newChecksum) {
      unchanged++
      continue
    }

    if (!row.github_id) {
      console.error(`${LOG} ${guide.slug}: row ${row.id} has no github_id, cannot update.`)
      failures.push(guide.slug)
      continue
    }

    const reason = row.checksum ? 'content changed' : 'no stored checksum'
    if (!row.checksum) noStoredChecksum++

    if (DRY_RUN) {
      console.log(`  ~ ${guide.slug}`)
      console.log(`      reason:      ${reason}`)
      console.log(`      discussion:  UPDATE ${row.github_url} (${row.github_id})`)
      console.log(`      title:       ${guide.title}`)
      console.log(`      body:        ${guide.body.length} chars`)
      console.log(
        `      row:         UPDATE row ${row.id} { checksum: ${row.checksum ?? 'null'} -> ${newChecksum} }`
      )
      updated++
      continue
    }

    try {
      await updateDiscussion(octokit, row.github_id, guide.title, guide.body)
      const { error } = await db
        .from('troubleshooting_entries')
        .update({ checksum: newChecksum })
        .eq('id', row.id)
      if (error) throw error
      console.log(`  - updated ${guide.slug} (${reason}) -> ${row.github_url}`)
      updated++
    } catch (err) {
      console.error(`${LOG} Failed to update ${guide.slug}:`, err)
      failures.push(guide.slug)
    }
  }

  console.log(
    `\n${LOG} ${DRY_RUN ? 'Would update' : 'Updated'} ${updated} discussion(s) ` +
      `(${updated - noStoredChecksum} changed, ${noStoredChecksum} with no stored checksum); ` +
      `${unchanged} unchanged, ${withoutRow} without a row yet.`
  )
  if (failures.length > 0) {
    console.error(`${LOG} Failed: ${failures.join(', ')}`)
    process.exitCode = 1
  }
}

syncDiscussionUpdates().catch((error) => {
  console.error(error)
  process.exit(1)
})
