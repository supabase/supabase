// Shared by sync-troubleshooting-entries.ts and sync-troubleshooting-updates.ts,
// so both agree on how guides are read, checksummed, and matched to rows.
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

/** The one definition of a guide's checksum. Changing it invalidates every stored one. */
export function computeChecksum(title: string, body: string): string {
  return createHash('sha256').update(JSON.stringify({ title, body })).digest('hex')
}

/**
 * Reads the guides fetch-federated-content.ts wrote. The slug is the file name
 * without its extension (hash suffix included), the key to the guide's row.
 * Throws if there are none, so a failed fetch isn't reported as "nothing to do".
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

/** Every row, slug-less ones included, paged (PostgREST caps responses at 1000). */
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
 * Discussions that already carry a new guide's title:
 *   - orphan:       no row references it,
 *   - slugless-row: a slug-less row references it (its slug needs backfilling),
 *   - other-slug:   a row with a different slug references it (warn only).
 * The first two block creation (see `isBlocking`).
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
