// Pushes title/content updates to already-synced GitHub Discussions when the
// local guide's checksum differs from the one stored on its row (a null
// checksum counts as changed). Guides are matched to rows by exact slug; a
// guide with no row is skipped (sync-troubleshooting-entries.ts creates it).
// The discussion is updated first and the checksum stored second, so a failed
// DB write only means the next run pushes the same content again.
//
// Run after sync-troubleshooting-entries.ts, from CI only.
//
// --dry-run is read-only: prints each discussion it would update (url, id,
// old -> new checksum) and updates nothing.
import '../utils/dotenv.js'

import { createPacer, isRateLimitError, readMinIntervalMs } from './github-throttle.ts'
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
  // retries: 0 disables @octokit/plugin-retry; mutations are sent once.
  await octokit.graphql(mutation, { discussionId, title, body, request: { retries: 0 } })
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
  const notAttempted: string[] = []

  const minIntervalMs = readMinIntervalMs()
  const pace = createPacer(minIntervalMs)
  let rateLimited = false

  console.log(
    `${LOG} ${guides.length} local guide(s), ${entries.length} row(s)${DRY_RUN ? ' (dry run)' : ''}.`
  )
  if (DRY_RUN) {
    console.log(
      `  (pacing: at least ${minIntervalMs}ms between updates; a failed update is not retried)`
    )
  }

  for (const guide of guides) {
    const row = entryBySlug.get(guide.slug)
    if (!row) {
      withoutRow++
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

    // After a rate limit the next calls would fail too: stop, next run resumes.
    if (rateLimited) {
      notAttempted.push(guide.slug)
      continue
    }

    try {
      await pace()
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
      if (isRateLimitError(err)) rateLimited = true
    }
  }

  console.log(
    `\n${LOG} ${DRY_RUN ? 'Would update' : 'Updated'} ${updated} discussion(s) ` +
      `(${updated - noStoredChecksum} changed, ${noStoredChecksum} with no stored checksum); ` +
      `${unchanged} unchanged, ${withoutRow} without a row yet.`
  )
  if (notAttempted.length > 0) {
    console.error(
      `${LOG} Stopped early: GitHub rate-limited the request. ${notAttempted.length} discussion(s) not ` +
        `attempted, the next run will pick them up (or raise --delay-ms): ${notAttempted.join(', ')}`
    )
    process.exitCode = 1
  }
  if (failures.length > 0) {
    console.error(`${LOG} Failed: ${failures.join(', ')}`)
    process.exitCode = 1
  }
}

syncDiscussionUpdates().catch((error) => {
  console.error(error)
  process.exit(1)
})
