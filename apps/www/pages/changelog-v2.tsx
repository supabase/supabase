import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/outline'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'
import { paginateGraphql } from '@octokit/plugin-paginate-graphql'
import { Octokit as OctokitRest } from '@octokit/rest'
import { ChangelogRssButton } from '~/components/Changelog/ChangelogRssButton'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import { discussionDisplayDate, githubChangelogLabelFilterUrl } from '~/lib/changelog.utils'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import dayjs from 'dayjs'
import { GitCommit } from 'lucide-react'
import { GetServerSideProps } from 'next'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { Badge } from 'ui'

const CHANGELOG_CATEGORY_ID = 'DIC_kwDODMpXOc4CAFUr'

type ChangelogLabel = { name: string; color: string }

type DiscussionMetadata = {
  id: string
  title: string
  publishedAt: string | null
  createdAt: string
  url: string
}

type Entry = {
  id: string
  title: string
  url: string
  created_at: string
  source: MDXRemoteSerializeResult
  type: string
  labels?: ChangelogLabel[]
}

type DiscussionsPageResponse = {
  repository: {
    discussions: {
      totalCount: number
      nodes: Array<
        DiscussionMetadata & {
          body: string
          labels?: {
            nodes: ChangelogLabel[]
          }
        }
      >
      pageInfo: {
        hasPreviousPage: boolean
        hasNextPage: boolean
        startCursor: string | null
        endCursor: string | null
      }
    }
  }
}

type DiscussionsMetadataResponse = {
  repository: {
    discussions: {
      nodes: DiscussionMetadata[]
      pageInfo: {
        hasNextPage: boolean
        endCursor: string | null
      }
    }
  }
}

function createChangelogOctokit() {
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

async function fetchAllDiscussionMetadata(
  octokit: ReturnType<typeof createChangelogOctokit>,
  owner: string,
  repo: string,
  categoryId: string
): Promise<DiscussionMetadata[]> {
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
            title
            publishedAt
            createdAt
            url
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `

  const collected: DiscussionMetadata[] = []
  let cursor: string | null = null
  let hasNextPage = true

  while (hasNextPage) {
    const {
      repository: {
        discussions: { nodes, pageInfo },
      },
    } = await octokit.graphql<DiscussionsMetadataResponse>(query, {
      owner,
      repo,
      categoryId,
      cursor,
    })

    collected.push(...nodes)
    hasNextPage = pageInfo.hasNextPage
    cursor = pageInfo.endCursor
  }

  return collected
}

async function fetchDiscussionsPage(
  octokit: ReturnType<typeof createChangelogOctokit>,
  owner: string,
  repo: string,
  categoryId: string,
  cursor: string | null = null
) {
  const query = `
    query changelogDiscussionsPage($cursor: String, $owner: String!, $repo: String!, $categoryId: ID!) {
      repository(owner: $owner, name: $repo) {
        discussions(
          first: 10
          after: $cursor
          categoryId: $categoryId
          orderBy: { field: CREATED_AT, direction: DESC }
        ) {
          totalCount
          pageInfo {
            hasPreviousPage
            hasNextPage
            startCursor
            endCursor
          }
          nodes {
            id
            publishedAt
            createdAt
            url
            title
            body
            labels(first: 25) {
              nodes {
                name
                color
              }
            }
          }
        }
      }
    }
  `

  const {
    repository: {
      discussions: { nodes: discussions, pageInfo },
    },
  } = await octokit.graphql<DiscussionsPageResponse>(query, {
    owner,
    repo,
    categoryId,
    cursor,
  })

  return { discussions, pageInfo }
}

function isEncoded(uri: string | null | undefined) {
  uri = uri ?? ''
  return uri !== decodeURIComponent(uri)
}

const recursiveDecodeURI = (uri: string | null) => {
  if (!uri) {
    return uri
  }
  let tries = 0
  let decoded = uri
  while (isEncoded(decoded)) {
    decoded = decodeURIComponent(decoded)
    tries++
    if (tries > 10) {
      break
    }
  }

  return decoded
}

export const getServerSideProps: GetServerSideProps = async ({ res, query }) => {
  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=900')
  const encodedNext = (query.next ?? null) as string | null
  const next = recursiveDecodeURI(encodedNext)
  const restPage = query.restPage ? Number(query.restPage) : 1

  const octokitRest = new OctokitRest({
    auth: process.env.GITHUB_CHANGELOG_APP_REST_KEY,
  })

  async function fetchGitHubReleases() {
    try {
      const response = await octokitRest.repos.listReleases({
        owner: 'supabase',
        repo: 'supabase',
        per_page: 10,
        page: restPage,
      })

      return response.data || []
    } catch (error) {
      console.error(error)
      return []
    }
  }

  const oldReleases = [
    40981345, 39091930, 37212777, 35927141, 34612423, 33383788, 32302703, 30830915, 29357247,
    28108378,
  ]

  const releases = (await fetchGitHubReleases()).filter(
    (release) => release.id && oldReleases.includes(release.id)
  )

  const octokit = createChangelogOctokit()

  const [discussionIndex, { discussions, pageInfo }] = await Promise.all([
    fetchAllDiscussionMetadata(octokit, 'supabase', 'supabase', CHANGELOG_CATEGORY_ID),
    fetchDiscussionsPage(octokit, 'supabase', 'supabase', CHANGELOG_CATEGORY_ID, next),
  ])

  if (!discussions) {
    return {
      props: {
        notFound: true,
      },
    }
  }

  const indexWithDates = discussionIndex
    .map((item) => ({
      ...item,
      sortDate: discussionDisplayDate(item),
    }))
    .sort((a, b) => dayjs(b.sortDate).diff(dayjs(a.sortDate)))

  const formattedDiscussions = await Promise.all(
    discussions.map(async (item): Promise<Entry | undefined> => {
      try {
        const discussionsMdxSource: MDXRemoteSerializeResult = await mdxSerialize(item.body)
        const created_at = discussionDisplayDate(item)

        const labels =
          item.labels?.nodes?.map((l) => ({
            name: l.name,
            color: (l.color || '6b7280').replace(/^#/, ''),
          })) ?? []

        return {
          id: item.id,
          title: item.title,
          url: item.url,
          source: discussionsMdxSource,
          type: 'discussion',
          created_at,
          labels,
        }
      } catch (err) {
        console.error(`Problem processing discussion MDX: ${err}`)
      }
    })
  )

  const formattedReleases = await Promise.all(
    releases.map(async (item: any): Promise<Entry | undefined> => {
      try {
        const releasesMdxSource: MDXRemoteSerializeResult = await mdxSerialize(item.body)

        return {
          id: String(item.id),
          title: item.name ?? '',
          url: item.html_url ?? '',
          source: releasesMdxSource,
          type: 'release',
          created_at: item.created_at,
        }
      } catch (err) {
        console.error(`Problem processing discussion MDX: ${err}`)
      }
    })
  )

  const combinedEntries = formattedDiscussions.concat(formattedReleases).filter(Boolean) as Entry[]

  const sortedCombinedEntries = combinedEntries.sort((a, b) => {
    const dateA = dayjs(a.created_at)
    const dateB = dayjs(b.created_at)

    if (dateA.isValid() && dateB.isValid()) {
      return dateB.diff(dateA)
    } else {
      return 0
    }
  })

  return {
    props: {
      changelogIndex: indexWithDates,
      changelog: sortedCombinedEntries,
      pageInfo: pageInfo,
      restPage: Number(restPage),
    },
  }
}

interface ChangelogV2PageProps {
  changelogIndex: Array<DiscussionMetadata & { sortDate: string }>
  changelog: Entry[]
  pageInfo: {
    hasPreviousPage: boolean
    hasNextPage: boolean
    startCursor: string | null
    endCursor: string | null
  }
  restPage: number
}

function ChangelogV2Page({ changelogIndex, changelog, pageInfo, restPage }: ChangelogV2PageProps) {
  const { endCursor: end, hasNextPage, hasPreviousPage } = pageInfo

  const TITLE = 'Changelog'
  const DESCRIPTION = 'New updates and improvements to Supabase'

  const visibleIndex = changelogIndex.filter((item) => !item.title.includes('[d]'))

  return (
    <>
      <NextSeo
        title={TITLE}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: `https://supabase.com/changelog-v2`,
          type: 'article',
        }}
      />
      <DefaultLayout>
        <div
          className="
            container mx-auto max-w-5xl flex flex-col
            gap-8
            px-4 py-10 sm:px-16
            xl:px-20
          "
        >
          <div className="pb-4">
            <h1 className="h1">Changelog</h1>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-foreground-lighter text-lg">
                New updates and product improvements
              </p>
              <ChangelogRssButton />
            </div>
          </div>

          <section
            aria-label="All changelog entries"
            className="border-muted bg-surface-100 rounded-lg border p-4"
          >
            <h2 className="text-foreground mb-3 text-sm font-medium">All entries</h2>
            <ul className="border-muted max-h-64 list-none space-y-0 overflow-y-auto overscroll-contain border-t pt-3 sm:max-h-80">
              {visibleIndex.map((item) => (
                <li
                  key={item.id}
                  className="border-muted hover:bg-surface-200 -mx-2 rounded border-b px-2 py-2 last:border-b-0"
                >
                  <Link
                    href={item.url}
                    className="flex flex-col gap-0.5 no-underline sm:flex-row sm:items-baseline sm:gap-3"
                  >
                    <span className="text-foreground shrink-0 text-sm">{item.title}</span>
                    <span className="text-foreground-lighter font-mono text-xs whitespace-nowrap">
                      {dayjs(item.sortDate).format('MMM D, YYYY')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid">
            {changelog.length > 0 &&
              changelog
                .filter((entry: Entry) => !entry.title.includes('[d]'))
                .map((entry: Entry, i: number) => {
                  return (
                    <div
                      key={i}
                      className="border-muted grid lg:border-l lg:grid-cols-12 lg:gap-8 pb-12 lg:pb-36"
                    >
                      <div
                        className="col-span-12 mb-8 self-start lg:sticky lg:top-0 lg:col-span-4 lg:-mt-32 lg:pt-32
                "
                      >
                        <div className="flex w-full items-baseline border-b lg:border-none pb-4 lg:pb-0 lg:gap-4">
                          <div className="hidden lg:flex bg-border border-muted text-foreground-lighter -ml-2.5 h-5 w-5 items-center justify-center rounded border drop-shadow-sm">
                            <GitCommit size={14} strokeWidth={1.5} />
                          </div>
                          <div className="flex w-full flex-col gap-1">
                            {entry.title && (
                              <Link href={entry.url}>
                                <h3 className="text-foreground text-lg">{entry.title}</h3>{' '}
                              </Link>
                            )}
                            <p className="text-foreground-lighter leading-4 text-xs font-mono">
                              {dayjs(entry.created_at).format('MMM D, YYYY')}
                            </p>
                            {entry.labels && entry.labels.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1.5">
                                {entry.labels.map((label) => (
                                  <a
                                    key={`${entry.id}-${label.name}`}
                                    href={githubChangelogLabelFilterUrl(label.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex no-underline focus-visible:ring-brand-default rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                                  >
                                    <Badge className="!text-[11px] lowercase py-1 px-2 !tracking-normal text-foreground-lighter">
                                      {label.name}
                                    </Badge>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-8 lg:max-w-[calc(100vw-80px)]">
                        <article className="prose prose-docs max-w-none [overflow-wrap:break-word]">
                          <MDXRemote {...entry.source} components={mdxComponents('blog')} />
                        </article>
                      </div>
                    </div>
                  )
                })}
          </div>
          <div className="my-8 flex items-center gap-4">
            {hasPreviousPage && (
              <Link href={`/changelog-v2`} className="flex items-center gap-2">
                <ArrowLeftIcon width={14} /> Previous
              </Link>
            )}
            {hasNextPage && (
              <Link
                href={`/changelog-v2?next=${end}&restPage=${restPage + 1}`}
                className="flex items-center gap-2"
              >
                Next <ArrowRightIcon width={14} />
              </Link>
            )}
          </div>
        </div>

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default ChangelogV2Page
