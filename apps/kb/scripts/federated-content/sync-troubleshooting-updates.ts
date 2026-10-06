// Pushes title/content updates to already-synced GitHub Discussions when the
// local troubleshooting guide has changed. Compares a stored checksum against
// a freshly computed one — never the discussion's live content — so this is
// immune to whatever GitHub does internally to stored title/body. A null
// checksum (a row created before this column existed) always counts as
// changed. Run after sync-troubleshooting-entries.ts, from CI only. Pass
// --dry-run to log without writing anything.
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Octokit } from '@octokit/core'
import { retry } from '@octokit/plugin-retry'
import { createClient } from '@supabase/supabase-js'
import matter from 'gray-matter'

import { githubAuthOptions } from './github-auth.ts'

const REPOSITORY_OWNER = 'supabase'
const REPOSITORY_NAME = 'supabase'
const TROUBLESHOOTING_CATEGORY_ID = 'DIC_kwDODMpXOc4CUvEr' // "Troubleshooting" discussion category

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

type Discussion = { id: string; url: string }

async function listTroubleshootingDiscussions(): Promise<Discussion[]> {
  const query = `
    query getDiscussions($cursor: String) {
      repository(owner: "${REPOSITORY_OWNER}", name: "${REPOSITORY_NAME}") {
        discussions(first: 100, after: $cursor, categoryId: "${TROUBLESHOOTING_CATEGORY_ID}") {
          pageInfo { hasNextPage endCursor }
          nodes { id url }
        }
      }
    }
  `
  const discussions: Discussion[] = []
  let cursor: string | undefined
  let hasNextPage = true

  while (hasNextPage) {
    const result = await octokit.graphql<{
      repository: {
        discussions: { nodes: Discussion[]; pageInfo: { hasNextPage: boolean; endCursor: string } }
      }
    }>(query, { cursor })
    discussions.push(...result.repository.discussions.nodes)
    hasNextPage = result.repository.discussions.pageInfo.hasNextPage
    cursor = result.repository.discussions.pageInfo.endCursor
  }

  return discussions
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
  const [guides, discussions] = await Promise.all([
    readLocalGuides(),
    listTroubleshootingDiscussions(),
  ])
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  const { data: rows, error } = await db
    .from('troubleshooting_entries')
    .select('slug, github_url, checksum')
    .in(
      'slug',
      guides.map((guide) => guide.slug)
    )
  if (error) throw error

  const rowBySlug = new Map((rows ?? []).map((row) => [row.slug, row]))
  const discussionByUrl = new Map(discussions.map((discussion) => [discussion.url, discussion]))

  let updatedCount = 0
  const failures: string[] = []

  for (const guide of guides) {
    const row = rowBySlug.get(guide.slug)
    if (!row) continue // not synced yet — sync-troubleshooting-entries.ts handles that

    const newChecksum = computeChecksum(guide.title, guide.body)
    if (row.checksum !== null && row.checksum === newChecksum) continue

    const discussion = discussionByUrl.get(row.github_url)
    if (!discussion) {
      console.error(
        `[sync-troubleshooting-updates] No discussion found for ${guide.slug} (${row.github_url})`
      )
      failures.push(guide.slug)
      continue
    }

    console.log(
      `[sync-troubleshooting-updates] Content changed for ${guide.slug}${DRY_RUN ? ' (dry run)' : ''}`
    )
    if (DRY_RUN) {
      updatedCount++
      continue
    }

    try {
      await updateDiscussion(discussion.id, guide.title, guide.body)
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
