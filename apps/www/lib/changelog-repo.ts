import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'

import {
  fetchChangelogEntryFilesFromTarball,
  getPublishedChangelogEntries,
} from './changelog-entries-core.mjs'

const CHANGELOG_REPO_OWNER = 'supabase'
const CHANGELOG_REPO_NAME = 'changelog'
const CHANGELOG_ENTRIES_PATH = 'entries'

export type ChangeType =
  | 'breaking-change'
  | 'deprecation'
  | 'new-feature'
  | 'improvement'
  | 'bug-fix'
  | 'security'
  | 'policy'

export type ChangelogEntryFrontmatter = {
  title: string
  change_type: ChangeType
  product_stage?: string | null
  affected_products: string[]
  affects_self_hosted?: boolean | null
  version?: string | null
  public: boolean
  publish_date?: string | null
  sunset_date?: string | null
  learn_more_url?: string | null
  rfc_url?: string | null
  legacy_gh_discussion?: number | null
}

export type ChangelogEntry = {
  /** URL-safe identifier. `legacy_gh_discussion-suffix` for backfilled entries, else the filename suffix. */
  slug: string
  filename: string
  frontmatter: ChangelogEntryFrontmatter
  /** Date used for sorting/display: publish_date, falling back to the filename's date prefix. */
  sortDate: string
  /** Contents of `## Summary` only. */
  summary: string
  /** Contents of `## Body` only. Never includes the internal block. */
  bodySection: string
  /** Contents of `## Migration steps`, if present. */
  migrationSteps: string
}

function createChangelogRepoOctokit() {
  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.CHANGELOG_SYNC_APP_ID,
      installationId: process.env.CHANGELOG_SYNC_APP_INSTALLATION_ID,
      privateKey: process.env.CHANGELOG_SYNC_APP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
  })
}

/**
 * supabase/changelog is the source of truth — no fallback source. If this
 * throws (outage, misconfigured App access, etc.), it propagates so the
 * failure is loud and visible rather than silently degrading to a stale or
 * differently-shaped data source.
 */
async function listChangelogEntries(): Promise<ChangelogEntry[]> {
  const octokit = createChangelogRepoOctokit()
  const files = await fetchChangelogEntryFilesFromTarball(octokit, {
    owner: CHANGELOG_REPO_OWNER,
    repo: CHANGELOG_REPO_NAME,
    entriesPath: CHANGELOG_ENTRIES_PATH,
  })
  return getPublishedChangelogEntries(files) as ChangelogEntry[]
}

const CACHE_TTL_MS = 5 * 60 * 1000

let cachedEntries: Promise<ChangelogEntry[]> | null = null
let cachedAt = 0

/** All public, currently-published changelog entries, newest first. */
export async function getChangelogEntries(): Promise<ChangelogEntry[]> {
  if (!cachedEntries || Date.now() - cachedAt > CACHE_TTL_MS) {
    cachedAt = Date.now()
    cachedEntries = listChangelogEntries().catch((error) => {
      // Clear cache on failure so the next call retries instead of reusing the rejection.
      cachedEntries = null
      cachedAt = 0
      throw error
    })
  }
  return cachedEntries
}

export async function getChangelogEntryBySlug(slug: string): Promise<ChangelogEntry | null> {
  const entries = await getChangelogEntries()
  return entries.find((entry) => entry.slug === slug) ?? null
}
