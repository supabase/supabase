import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'
import { paginateGraphql } from '@octokit/plugin-paginate-graphql'

/** GitHub Discussions category: Changelog (supabase/supabase) — same as apps/www. */
export const CHANGELOG_CATEGORY_ID = 'DIC_kwDODMpXOc4CAFUr'

export type ChangelogRecentItem = { title: string; url: string }

/** PEM in .env is often one line with escaped `\n` — @octokit/auth-app needs real newlines (see apps/www/scripts/generateStaticContent.mjs). */
function normalizeGithubAppPrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined
  return key.trim().replace(/\\n/g, '\n')
}

function parseInstallationId(raw: string | undefined): string | number | undefined {
  if (!raw) return undefined
  const t = raw.trim()
  if (!t) return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : t
}

function createChangelogOctokit() {
  const appId = process.env.GITHUB_CHANGELOG_APP_ID?.trim()
  const installationId = parseInstallationId(process.env.GITHUB_CHANGELOG_APP_INSTALLATION_ID)
  const privateKey = normalizeGithubAppPrivateKey(process.env.GITHUB_CHANGELOG_APP_PRIVATE_KEY)

  const ExtendedOctokit = Octokit.plugin(paginateGraphql)
  return new ExtendedOctokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      installationId,
      privateKey,
    },
  })
}

function isChangelogGithubConfigured() {
  return Boolean(
    process.env.GITHUB_CHANGELOG_APP_ID?.trim() &&
      process.env.GITHUB_CHANGELOG_APP_INSTALLATION_ID?.trim() &&
      normalizeGithubAppPrivateKey(process.env.GITHUB_CHANGELOG_APP_PRIVATE_KEY)
  )
}

/**
 * Latest changelog discussion titles/URLs from the supabase/supabase repo
 * (same GraphQL source as www changelog-v6).
 */
export async function getRecentChangelogDiscussions(limit: number): Promise<ChangelogRecentItem[]> {
  if (!isChangelogGithubConfigured() || limit < 1) {
    return []
  }

  const octokit = createChangelogOctokit()

  const query = `
    query recentChangelogDiscussions(
      $owner: String!
      $repo: String!
      $categoryId: ID!
      $first: Int!
    ) {
      repository(owner: $owner, name: $repo) {
        discussions(
          first: $first
          categoryId: $categoryId
          orderBy: { field: CREATED_AT, direction: DESC }
        ) {
          nodes {
            title
            url
          }
        }
      }
    }
  `

  const data = await octokit.graphql<{
    repository: {
      discussions: { nodes: Array<{ title: string; url: string } | null> } | null
    } | null
  }>(query, {
    owner: 'supabase',
    repo: 'supabase',
    categoryId: CHANGELOG_CATEGORY_ID,
    first: limit,
  })

  const nodes = data.repository?.discussions?.nodes ?? []
  return nodes
    .filter((n): n is ChangelogRecentItem => Boolean(n?.title && n?.url))
    .slice(0, limit)
}
