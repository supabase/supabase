/* eslint-disable turbo/no-undeclared-env-vars */
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'
import { paginateGraphql } from '@octokit/plugin-paginate-graphql'
import { createHash } from 'crypto'
import { BaseLoader, BaseSource } from './base'

export const ExtendedOctokit = Octokit.plugin(paginateGraphql)
export type ExtendedOctokit = InstanceType<typeof ExtendedOctokit>

export type Discussion = {
  id: string
  updatedAt: string
  url: string
  title: string
  body: string
  databaseId: number
  createdAt: string
  labels: {
    nodes: {
      name: string
    }[]
  }
  ragIgnore?: boolean
}

export type DiscussionsResponse = {
  repository: {
    discussions: {
      totalCount: number
      nodes: Discussion[]
      pageInfo: {
        hasNextPage: boolean
        endCursor: string
      }
    }
  }
}

/**
 * Fetches GitHub discussions for a repository + category
 */
export async function fetchDiscussions(owner: string, repo: string, categoryId: string) {
  const octokit = new ExtendedOctokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.SEARCH_GITHUB_APP_ID,
      installationId: process.env.SEARCH_GITHUB_APP_INSTALLATION_ID,
      privateKey: process.env.SEARCH_GITHUB_APP_PRIVATE_KEY,
    },
  })

  const {
    repository: {
      discussions: { nodes: discussions },
    },
  } = await octokit.graphql.paginate<DiscussionsResponse>(
    `
      query troubleshootDiscussions($cursor: String, $owner: String!, $repo: String!, $categoryId: ID!) {
        repository(owner: $owner, name: $repo) {
          discussions(first: 100, after: $cursor, categoryId: $categoryId) {
            totalCount
            nodes {
              id
              updatedAt
              url
              title
              body
              databaseId
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    `,
    {
      owner,
      repo,
      categoryId,
    }
  )

  return discussions
}

export async function fetchDiscussionsSinceDate(
  owner: string,
  repo: string,
  categoryId: string,
  { batchSize = 100, orderBy, sinceDate }: { batchSize?: number; orderBy?: string; sinceDate: Date }
) {
  const octokit = new ExtendedOctokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.SEARCH_GITHUB_APP_ID,
      installationId: process.env.SEARCH_GITHUB_APP_INSTALLATION_ID,
      privateKey: process.env.SEARCH_GITHUB_APP_PRIVATE_KEY,
    },
  })

  let endCursor: string | undefined
  let hasNextPage = true
  let allDiscussions: Discussion[] = []

  while (hasNextPage) {
    const {
      repository: {
        discussions: { nodes: discussions, pageInfo },
      },
    } = await octokit.graphql<DiscussionsResponse>(
      `
        query troubleshootDiscussions($cursor: String, $owner: String!, $repo: String!, $categoryId: ID!, $batchSize: Int!, $orderBy: DiscussionOrderField!) {
          repository(owner: $owner, name: $repo) {
            discussions(first: $batchSize, after: $cursor, categoryId: $categoryId, orderBy: {field: $orderBy, direction: DESC}) {
              totalCount
              nodes {
                id
                updatedAt
                url
                title
                body
                databaseId
                createdAt
                labels(first: $batchSize) {
                  nodes {
                    name
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
      `,
      {
        owner,
        repo,
        categoryId,
        batchSize,
        orderBy,
        cursor: endCursor,
      }
    )

    allDiscussions.push(...discussions)
    hasNextPage = pageInfo.hasNextPage
    endCursor = pageInfo.endCursor

    if (discussions.length > 0) {
      const lastDiscussionDate = new Date(discussions[discussions.length - 1].createdAt)
      if (lastDiscussionDate < sinceDate) {
        break
      }
    }
  }

  const discussions = allDiscussions.filter(
    (discussion) => new Date(discussion.createdAt) >= sinceDate
  )

  return discussions
}

export class GitHubDiscussionLoader extends BaseLoader {
  type = 'github-discussions' as const

  constructor(
    source: string,
    public discussion: Discussion
  ) {
    super(source, discussion.url)
  }

  async load() {
    return [new GitHubDiscussionSource(this.source, this.path, this.discussion)]
  }
}

export class GitHubDiscussionSource extends BaseSource {
  type = 'github-discussions' as const

  constructor(
    source: string,
    path: string,
    public discussion: Discussion
  ) {
    super(source, path)
  }

  process() {
    const { id, title, updatedAt, body, databaseId, ragIgnore } = this.discussion

    const checksum = createHash('sha256').update(updatedAt).digest('base64')

    const meta = { id, title, updatedAt }

    // Currently the discussion post itself is being considered as the answer
    // (as opposed to a comment marked as answer)
    // So we link the slug to the initial discussion post rather than a comment answer
    const slug = `discussion-${databaseId}`

    // Format the discussion title + body as markdown for better embeddings + LLM response
    const content = `# ${title}\n${body}`

    // For now, only a single section is created for GH discussions
    // Consider adding multiple if we want to include comments/answers
    const sections = [
      {
        heading: title,
        slug,
        content,
      },
    ]

    this.checksum = checksum
    this.meta = meta
    this.sections = sections

    return {
      checksum,
      meta,
      ragIgnore,
      sections,
    }
  }

  extractIndexedContent(): string {
    const sections = this.sections ?? []
    return sections.map(({ heading, content }) => `${heading}\n\n${content}`).join('\n')
  }
}
