// Shared by sync-troubleshooting-entries.ts and sync-troubleshooting-updates.ts.
// Kept in one place so both scripts always agree on how a guide is read, what
// its checksum is, and how a guide maps to a troubleshooting_entries row.
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Octokit } from '@octokit/core'
import { retry } from '@octokit/plugin-retry'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import matter from 'gray-matter'

import { githubAuthOptions } from './github-auth.ts'

export const REPOSITORY_ID = 'MDEwOlJlcG9zaXRvcnkyMTQ1ODcxOTM=' // supabase/supabase
export const TROUBLESHOOTING_CATEGORY_ID = 'DIC_kwDODMpXOc4CUvEr' // "Troubleshooting" discussion category

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
export const TROUBLESHOOTING_DIRECTORY = join(SCRIPT_DIR, '../../src/content/troubleshooting')

export type LocalGuide = { slug: string; title: string; body: string }

export type EntryRow = {
  id: string
  slug: string | null
  github_id: string
  github_url: string
  checksum: string | null
}

export type CategoryDiscussion = { id: string; url: string; title: string }

const RetryOctokit = Octokit.plugin(retry)
export type RetryOctokitInstance = InstanceType<typeof RetryOctokit>

export function createOctokit(): RetryOctokitInstance {
  return new RetryOctokit(githubAuthOptions())
}

export function createDb(): SupabaseClient {
  return createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )
}

/**
 * The single definition of a guide's checksum: what a discussion is stored as
 * having been last synced with. Changing this invalidates every stored checksum.
 */
export function computeChecksum(title: string, body: string): string {
  return createHash('sha256').update(JSON.stringify({ title, body })).digest('hex')
}

/**
 * Reads every guide fetch-federated-content.ts wrote. The slug is the file
 * name without its extension, hash suffix included, and is the key that ties a
 * guide to its troubleshooting_entries row. Throws when there are no guides at
 * all (a failed or skipped fetch), rather than letting the sync report
 * "nothing to do".
 */
export async function readLocalGuides(): Promise<LocalGuide[]> {
  const filenames = (await readdir(TROUBLESHOOTING_DIRECTORY)).filter((f) => f.endsWith('.mdx'))
  if (filenames.length === 0) {
    throw new Error(
      `No .mdx guides in ${TROUBLESHOOTING_DIRECTORY}. Run fetch-federated-content.ts first.`
    )
  }

  const guides: LocalGuide[] = []
  await Promise.all(
    filenames.map(async (filename) => {
      const raw = await readFile(join(TROUBLESHOOTING_DIRECTORY, filename), 'utf-8')
      const { data, content: body } = matter(raw)
      const slug = filename.replace(/\.mdx$/, '')
      // Never create or push a discussion titled "undefined".
      if (typeof data.title !== 'string' || data.title.trim() === '') {
        console.warn(`[troubleshooting-sync] Skipping ${slug}: no string \`title\` in frontmatter.`)
        return
      }
      guides.push({ slug, title: data.title, body })
    })
  )
  return guides.sort((a, b) => a.slug.localeCompare(b.slug))
}

/**
 * Every troubleshooting_entries row, including ones with no slug. Fetched in
 * full (paged, since PostgREST caps a response at 1000 rows) instead of with an
 * `.in('slug', …)` filter, which puts hundreds of slugs in the request URL and
 * would hide slug-less rows.
 */
export async function fetchAllEntries(db: SupabaseClient): Promise<EntryRow[]> {
  const pageSize = 1000
  const rows: EntryRow[] = []
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await db
      .from('troubleshooting_entries')
      .select('id, slug, github_id, github_url, checksum')
      .order('id')
      .range(from, from + pageSize - 1)
    if (error) throw error
    rows.push(...(data as EntryRow[]))
    if (data.length < pageSize) return rows
  }
}

/** Every discussion currently in the Troubleshooting category. */
export async function listCategoryDiscussions(
  octokit: RetryOctokitInstance
): Promise<CategoryDiscussion[]> {
  const discussions: CategoryDiscussion[] = []
  let after: string | null = null
  for (;;) {
    const page: {
      node: {
        discussions: {
          nodes: CategoryDiscussion[]
          pageInfo: { hasNextPage: boolean; endCursor: string | null }
        }
      } | null
    } = await octokit.graphql(
      `query ($repository: ID!, $category: ID!, $after: String) {
         node(id: $repository) {
           ... on Repository {
             discussions(categoryId: $category, first: 100, after: $after) {
               nodes { id url title }
               pageInfo { hasNextPage endCursor }
             }
           }
         }
       }`,
      { repository: REPOSITORY_ID, category: TROUBLESHOOTING_CATEGORY_ID, after }
    )
    if (!page.node) throw new Error('Could not read discussions: repository node not found.')
    discussions.push(...page.node.discussions.nodes)
    const { hasNextPage, endCursor } = page.node.discussions.pageInfo
    if (!hasNextPage) return discussions
    after = endCursor
  }
}

export type TitleConflict =
  | { kind: 'orphan'; discussion: CategoryDiscussion }
  | { kind: 'slugless-row'; discussion: CategoryDiscussion; row: EntryRow }
  | { kind: 'other-slug'; discussion: CategoryDiscussion; row: EntryRow }

const normalizeTitle = (title: string) => title.trim().toLowerCase()

/**
 * Looks for discussions that already carry a new guide's title, i.e. the ways
 * creating one would duplicate a discussion that already exists:
 *   - orphan:       no row references it (e.g. a rollback that never completed),
 *   - slugless-row: a row references it but has no slug, so the guide never
 *                   matched it (the slug needs backfilling, not a new discussion),
 *   - other-slug:   a row with a DIFFERENT slug references it. Suspicious but
 *                   can be legitimate, so it only warns.
 * Only the first two should block creation (see `isBlocking`).
 */
export function findTitleConflicts(
  guideTitle: string,
  discussions: CategoryDiscussion[],
  entries: EntryRow[]
): TitleConflict[] {
  const rowByGithubId = new Map(entries.map((row) => [row.github_id, row]))
  const title = normalizeTitle(guideTitle)

  return discussions
    .filter((discussion) => normalizeTitle(discussion.title) === title)
    .map((discussion): TitleConflict => {
      const row = rowByGithubId.get(discussion.id)
      if (!row) return { kind: 'orphan', discussion }
      if (!row.slug) return { kind: 'slugless-row', discussion, row }
      return { kind: 'other-slug', discussion, row }
    })
}

export const isBlocking = (conflict: TitleConflict) => conflict.kind !== 'other-slug'

export function describeConflict(conflict: TitleConflict): string {
  switch (conflict.kind) {
    case 'orphan':
      return `discussion ${conflict.discussion.url} already has this title and no row references it`
    case 'slugless-row':
      return `discussion ${conflict.discussion.url} already has this title and belongs to slug-less row ${conflict.row.id} — backfill that row's slug instead`
    case 'other-slug':
      return `discussion ${conflict.discussion.url} has the same title but belongs to slug "${conflict.row.slug}"`
  }
}
