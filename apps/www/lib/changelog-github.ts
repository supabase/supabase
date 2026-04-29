import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'
import { paginateGraphql } from '@octokit/plugin-paginate-graphql'
import dayjs from 'dayjs'

import { changelogEntrySlug, discussionDisplayDate } from './changelog.utils'

export const CHANGELOG_CATEGORY_ID = 'DIC_kwDODMpXOc4CAFUr'

export type ChangelogLabel = { name: string; color: string }

export type ChangelogTimelineIndexItem = {
  number: number
  slug: string
  title: string
  url: string
  sortDate: string
  labels: ChangelogLabel[]
}

export type ChangelogDiscussionMetadata = {
  id: string
  number: number
  title: string
  publishedAt: string | null
  createdAt: string
  url: string
  labels?: {
    nodes: ChangelogLabel[]
  }
}

export function createChangelogOctokit() {
  const ExtendedOctokit = Octokit.plugin(paginateGraphql)
  return new ExtendedOctokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_CHANGELOG_APP_ID,
      installationId: process.env.GITHUB_CHANGELOG_APP_INSTALLATION_ID,
      privateKey: process.env.GITHUB_CHANGELOG_APP_PRIVATE_KEY,
    },
  })
}

export async function fetchAllChangelogDiscussionMetadata(
  octokit: ReturnType<typeof createChangelogOctokit>,
  owner: string,
  repo: string,
  categoryId: string
): Promise<ChangelogDiscussionMetadata[]> {
  type DiscussionMetadataResponse = {
    repository: {
      discussions: {
        nodes: ChangelogDiscussionMetadata[]
        pageInfo: { hasNextPage: boolean; endCursor: string | null }
      }
    }
  }

  const query = `
    query changelogDiscussionMetadata($cursor: String, $owner: String!, $repo: String!, $categoryId: ID!) {
      repository(owner: $owner, name: $repo) {
        discussions(
          first: 100
          after: $cursor
          categoryId: $categoryId
          orderBy: { field: CREATED_AT, direction: DESC }
        ) {
          nodes {
            id
            number
            title
            publishedAt
            createdAt
            url
            labels(first: 25) {
              nodes {
                name
                color
              }
            }
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `

  const collected: ChangelogDiscussionMetadata[] = []
  let cursor: string | null = null
  let hasNextPage = true

  while (hasNextPage) {
    const response: DiscussionMetadataResponse = await octokit.graphql(query, {
      owner,
      repo,
      categoryId,
      cursor,
    })
    const { nodes, pageInfo } = response.repository.discussions

    collected.push(...nodes)
    hasNextPage = pageInfo.hasNextPage
    cursor = pageInfo.endCursor
  }

  return collected
}

export type FetchedChangelogDiscussion = {
  number: number
  title: string
  body: string
  url: string
  createdAt: string
  category: { id: string; name: string } | null
  labels: { nodes: ChangelogLabel[] }
}

export async function fetchChangelogDiscussionByNumber(
  octokit: ReturnType<typeof createChangelogOctokit>,
  owner: string,
  repo: string,
  number: number
): Promise<FetchedChangelogDiscussion | null> {
  const query = `
    query changelogDiscussionByNumber($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        discussion(number: $number) {
          number
          title
          body
          url
          createdAt
          category {
            id
            name
          }
          labels(first: 25) {
            nodes {
              name
              color
            }
          }
        }
      }
    }
  `

  const data = await octokit.graphql<{
    repository: { discussion: FetchedChangelogDiscussion | null }
  }>(query, { owner, repo, number })

  return data.repository.discussion
}

export async function getChangelogTimelineSortedIndex(): Promise<ChangelogTimelineIndexItem[]> {
  const octokit = createChangelogOctokit()
  const raw = await fetchAllChangelogDiscussionMetadata(
    octokit,
    'supabase',
    'supabase',
    CHANGELOG_CATEGORY_ID
  )

  return raw
    .map((item) => ({
      number: item.number,
      slug: changelogEntrySlug(item.number, item.title),
      title: item.title,
      url: item.url,
      sortDate: discussionDisplayDate(item) ?? item.createdAt,
      labels:
        item.labels?.nodes?.map((l) => ({
          name: l.name,
          color: (l.color || '6b7280').replace(/^#/, ''),
        })) ?? [],
    }))
    .sort((a, b) => dayjs(b.sortDate).diff(dayjs(a.sortDate)))
}
