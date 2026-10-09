// Creates a GitHub Discussion for every troubleshooting guide that doesn't
// have a troubleshooting_entries row yet. Run after fetch-federated-content.ts,
// from CI only (never kb's own prebuild — this has real side effects). Pass
// --dry-run to log what would be created without creating anything.
import '../utils/dotenv.js'

import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Octokit } from '@octokit/core'
import { retry } from '@octokit/plugin-retry'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import matter from 'gray-matter'

import { githubAuthOptions } from './github-auth.ts'

const REPOSITORY_ID = 'MDEwOlJlcG9zaXRvcnkyMTQ1ODcxOTM=' // supabase/supabase
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

async function createDiscussion(title: string, body: string): Promise<{ id: string; url: string }> {
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

async function deleteDiscussion(id: string): Promise<void> {
  const mutation = `
    mutation DeleteDiscussionMutation($discussionId: ID!) {
      deleteDiscussion(input: { discussionId: $discussionId }) { discussion { id } }
    }
  `
  await octokit.graphql(mutation, { discussionId: id })
}

// Small sequential batches, not one unbounded Promise.all — stays clear of
// GitHub's secondary rate limits when many guides are new at once (e.g. the
// first run). Isolates failures per guide instead of letting one abort the
// rest; failures are collected and reported (non-zero exit) at the end.
async function createNewGuides(
  db: SupabaseClient,
  guides: Array<{ slug: string; title: string; body: string }>
): Promise<string[]> {
  const failures: string[] = []
  const batchSize = 5

  for (let i = 0; i < guides.length; i += batchSize) {
    const batch = guides.slice(i, i + batchSize)
    const results = await Promise.allSettled(
      batch.map(async (guide) => {
        console.log(`  - ${guide.slug}`)
        if (DRY_RUN) return

        const discussion = await createDiscussion(guide.title, guide.body)
        const { error } = await db.from('troubleshooting_entries').insert({
          slug: guide.slug,
          github_url: discussion.url,
          github_id: discussion.id,
          checksum: computeChecksum(guide.title, guide.body),
        })
        if (error) {
          console.error(
            `[sync-troubleshooting-entries] DB insert failed for ${guide.slug}, rolling back discussion`
          )
          await deleteDiscussion(discussion.id)
          throw error
        }
      })
    )
    results.forEach((result, j) => {
      if (result.status === 'rejected') {
        console.error(`[sync-troubleshooting-entries] Failed for ${batch[j].slug}:`, result.reason)
        failures.push(batch[j].slug)
      }
    })
  }

  return failures
}

async function syncNewDiscussions() {
  const guides = await readLocalGuides()
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  const { data: existing, error } = await db
    .from('troubleshooting_entries')
    .select('slug')
    .in(
      'slug',
      guides.map((guide) => guide.slug)
    )
  if (error) throw error

  const existingSlugs = new Set((existing ?? []).map((row) => row.slug))
  const newGuides = guides.filter((guide) => !existingSlugs.has(guide.slug))

  if (newGuides.length === 0) {
    console.log('[sync-troubleshooting-entries] No new troubleshooting guides to sync.')
    return
  }

  console.log(
    `[sync-troubleshooting-entries] ${newGuides.length} new guide(s)${DRY_RUN ? ' (dry run)' : ''}:`
  )
  const failures = await createNewGuides(db, newGuides)

  console.log(
    `[sync-troubleshooting-entries] Synced ${newGuides.length - failures.length}/${newGuides.length} new guide(s).`
  )
  if (failures.length > 0) {
    throw new Error(`Failed to sync: ${failures.join(', ')}`)
  }
}

syncNewDiscussions().catch((error) => {
  throw error
})
