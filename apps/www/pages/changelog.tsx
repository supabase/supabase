import { IconGitCommit } from 'ui'
import dayjs from 'dayjs'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { NextSeo } from 'next-seo'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { mdxSerialize } from '~/lib/mdx/mdxSerialize'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/core'
import { Octokit as OctokitRest } from '@octokit/rest'
import { paginateGraphql } from '@octokit/plugin-paginate-graphql'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { ArrowLeftIcon, ArrowRightIcon } from '@heroicons/react/outline'

export const ExtendedOctokit = Octokit.plugin(paginateGraphql)
export type ExtendedOctokit = InstanceType<typeof ExtendedOctokit>

export type Discussion = {
  id: string
  updatedAt: string
  url: string
  title: string
  body: string
}

type Entry = {
  id: string
  title: string
  url: string
  created_at: string
  source: MDXRemoteSerializeResult
  type: string
}

export type DiscussionsResponse = {
  repository: {
    discussions: {
      totalCount: number
      nodes: Discussion[]
      pageInfo: any
    }
  }
}

/**
 * [Terry]
 * this page powers supabase.com/changelog
 * this page used to just be a feed of the releases endpoint
 * (https://api.github.com/repos/supabase/supabase/releases) (rest api)
 * but is now a blend of that legacy relases and the new Changelog category of the Discussions
 * https://github.com/orgs/supabase/discussions/categories/changelog (graphql api)
 * We should use the Changelog Discussions category for all future changelog entries and stop using releases
 */

export const getServerSideProps: GetServerSideProps = async ({ res, query }) => {
  // refresh every 15 minutes
  res.setHeader('Cache-Control', 'public, max-age=900, stale-while-revalidate=900')
  const next = query.next ?? (null as string | null)
  const restPage = query.restPage ? Number(query.restPage) : 1

  const octokitRest = new OctokitRest({
    auth: process.env.GITHUB_CHANGELOG_APP_REST_KEY,
  })

  // uses the rest api
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

  const releases = await fetchGitHubReleases()

  // uses the graphql api
  async function fetchDiscussions(owner: string, repo: string, categoryId: string, cursor: string) {
    const octokit = new ExtendedOctokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_CHANGELOG_APP_ID,
        installationId: process.env.GITHUB_CHANGELOG_APP_INSTALLATION_ID,
        privateKey: process.env.GITHUB_CHANGELOG_APP_PRIVATE_KEY,
      },
    })

    const query = `
      query troubleshootDiscussions($cursor: String, $owner: String!, $repo: String!, $categoryId: ID!) {
        repository(owner: $owner, name: $repo) {
          discussions(first: 10, after: $cursor, categoryId: $categoryId, orderBy: { field: CREATED_AT, direction: DESC }) {
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
            }
          }
        }
      }
    `
    const queryVars = {
      owner,
      repo,
      categoryId,
      cursor: next,
    }

    // fetch discussions
    const {
      repository: {
        discussions: { nodes: discussions, pageInfo },
      },
    } = await octokit.graphql<DiscussionsResponse>(query, queryVars)

    return { discussions, pageInfo }
  }

  const { discussions, pageInfo } = await fetchDiscussions(
    'supabase',
    'supabase',
    'DIC_kwDODMpXOc4CAFUr', // 'Changelog' category
    next as string
  )

  if (!discussions) {
    return {
      props: {
        notFound: true,
      },
    }
  }

  // Process discussions
  const formattedDiscussions = await Promise.all(
    discussions.map(async (item: any): Promise<any> => {
      const discussionsMdxSource: MDXRemoteSerializeResult = await mdxSerialize(item.body)

      return {
        ...item,
        source: discussionsMdxSource,
        type: 'discussion',
        created_at: item.createdAt,
        url: item.url,
      }
    })
  )

  // Process releases
  const formattedReleases = await Promise.all(
    releases.map(async (item: any): Promise<any> => {
      const releasesMdxSource: MDXRemoteSerializeResult = await mdxSerialize(item.body)

      return {
        ...item,
        source: releasesMdxSource,
        type: 'release',
        created_at: item.created_at,
        title: item.name ?? '',
        url: item.html_url ?? '',
      }
    })
  )

  // Combine discussions and releases into a single array of entries
  const combinedEntries = formattedDiscussions.concat(formattedReleases)

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
      changelog: sortedCombinedEntries,
      pageInfo: pageInfo,
      restPage: Number(restPage),
    },
  }
}

interface ChangelogPageProps {
  changelog: Entry[]
  pageInfo: any
  restPage: number
}

function ChangelogPage({ changelog, pageInfo, restPage }: ChangelogPageProps) {
  const { endCursor: end, hasNextPage, hasPreviousPage } = pageInfo

  const TITLE = 'Changelog'
  const DESCRIPTION = 'New updates and improvements to Supabase'
  return (
    <>
      <NextSeo
        title={TITLE}
        openGraph={{
          title: TITLE,
          description: DESCRIPTION,
          url: `https://supabase.com/changelog`,
          type: 'article',
        }}
      />
      <DefaultLayout>
        <div
          className="
            container mx-auto flex flex-col
            gap-20
            px-4 py-10 sm:px-16
            xl:px-20
          "
        >
          <div className="py-10">
            <h1 className="h1">Changelog</h1>
            <p className="text-foreground-lighter text-lg">New updates and product improvements</p>
          </div>

          {/* Content */}
          <div className="grid gap-12 lg:gap-36">
            {changelog.length > 0 &&
              changelog
                .filter((entry: Entry) => !entry.title.includes('[d]'))
                .map((entry: Entry, i: number) => {
                  return (
                    <div key={i} className="border-muted grid border-l lg:grid-cols-12 lg:gap-8">
                      <div
                        className="col-span-12 mb-8 self-start lg:sticky lg:top-0 lg:col-span-4 lg:-mt-32 lg:pt-32
                "
                      >
                        <div className="flex w-full items-baseline gap-6">
                          <div className="bg-border border-muted text-foreground-lighter -ml-2.5 flex h-5 w-5 items-center justify-center rounded border drop-shadow-sm">
                            <IconGitCommit size={14} strokeWidth={1.5} />
                          </div>
                          <div className="flex w-full flex-col gap-1">
                            {entry.title && (
                              <Link href={entry.url}>
                                <h3 className="text-foreground text-2xl">{entry.title}</h3>{' '}
                              </Link>
                            )}
                            <p className="text-muted text-lg">
                              {dayjs(entry.created_at).format('MMM D, YYYY')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-8 ml-8 lg:ml-0 max-w-[calc(100vw-80px)]">
                        <article className="prose prose-docs max-w-none">
                          <MDXRemote {...entry.source} components={mdxComponents('blog')} />
                        </article>
                      </div>
                    </div>
                  )
                })}
          </div>
          <div className="my-8 flex items-center gap-4">
            {hasPreviousPage && (
              <Link href={`/changelog`} className="flex items-center gap-2">
                <ArrowLeftIcon width={14} /> Previous
              </Link>
            )}
            {hasNextPage && (
              <Link
                href={`/changelog?next=${end}&restPage=${restPage + 1}`}
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

export default ChangelogPage
