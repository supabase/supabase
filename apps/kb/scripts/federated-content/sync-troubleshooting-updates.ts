// Pushes title/content updates to already-synced GitHub Discussions when the
// local troubleshooting guide has changed. Compares a stored checksum against
// a freshly computed one — never the discussion's live content — so this is
// immune to whatever GitHub does internally to stored title/body. A null
// checksum (a row created before this column existed) always counts as
// changed. Updates target the discussion directly via the row's stored
// github_id — no need to list/paginate the category's discussions. Run after
// sync-troubleshooting-entries.ts, from CI only. Pass --dry-run to log
// without writing anything.
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Octokit } from '@octokit/core'
import { retry } from '@octokit/plugin-retry'
import { createClient } from '@supabase/supabase-js'
import matter from 'gray-matter'

import { githubAuthOptions } from './github-auth.ts'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const TROUBLESHOOTING_DIRECTORY = join(SCRIPT_DIR, '../../src/content/troubleshooting')

const DRY_RUN = process.argv.includes('--dry-run')

const RetryOctokit = Octokit.plugin(retry)
const octokit = new RetryOctokit(githubAuthOptions())

async function readLocalGuides(): Promise<Array<{ slug: string; title: string; body: string }>> {
  const filenames = (await readdir(TROUBLESHOOTING_DIRECTORY)).filter((f) => f.endsWith('.md'))
  return Promise.all(
    filenames.map(async (filename) => {
      const raw = await readFile(join(TROUBLESHOOTING_DIRECTORY, filename), 'utf-8')
      const { data, content: body } = matter(raw)
      return { slug: filename.replace(/\.md$/, ''), title: data.title as string, body }
    })
  )
}

function computeChecksum(title: string, body: string): string {
  return createHash('sha256').update(JSON.stringify({ title, body })).digest('hex')
}

async function updateDiscussion(discussionId: string, title: string, body: string): Promise<void> {
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
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  const { data: rows, error } = await db
    .from('troubleshooting_entries')
    .select('slug, github_id, checksum')
    .in(
      'slug',
      guides.map((guide) => guide.slug)
    )
  if (error) throw error

  const rowBySlug = new Map((rows ?? []).map((row) => [row.slug, row]))

  let updatedCount = 0
  const failures: string[] = []

  for (const guide of guides) {
    const row = rowBySlug.get(guide.slug)
    if (!row) continue // not synced yet — sync-troubleshooting-entries.ts handles that

    const newChecksum = computeChecksum(guide.title, guide.body)
    if (row.checksum !== null && row.checksum === newChecksum) continue

    console.log(
      `[sync-troubleshooting-updates] Content changed for ${guide.slug}${DRY_RUN ? ' (dry run)' : ''}`
    )
    if (DRY_RUN) {
      updatedCount++
      continue
    }

    try {
      await updateDiscussion(row.github_id, guide.title, guide.body)
      const { error: updateError } = await db
        .from('troubleshooting_entries')
        .update({ checksum: newChecksum })
        .eq('slug', guide.slug)
      if (updateError) throw updateError
      updatedCount++
    } catch (err) {
      console.error(`[sync-troubleshooting-updates] Failed to update ${guide.slug}:`, err)
      failures.push(guide.slug)
    }
  }

  console.log(`[sync-troubleshooting-updates] Updated ${updatedCount} discussion(s).`)
  if (failures.length > 0) {
    throw new Error(`Failed to sync: ${failures.join(', ')}`)
  }
}

syncDiscussionUpdates().catch((error) => {
  throw error
})
