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
import { paginateGraphql } from '@octokit/plugin-paginate-graphql'
import { GetServerSideProps } from 'next'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export const ExtendedOctokit = Octokit.plugin(paginateGraphql)
export type ExtendedOctokit = InstanceType<typeof ExtendedOctokit>

export type Discussion = {
  id: string
  updatedAt: string
  url: string
  title: string
  body: string
  databaseId: number
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

export const getServerSideProps: GetServerSideProps = async ({ res, query }) => {
  res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=3600')
  const pageNumber = Number(query.page) ?? 1
  const next = query.next ?? (null as string | null)
  const forward = query.forward ?? null
  console.log({ next }, { forward })
  const perPage = 2
  //const response = await fetch('https://api.github.com/repos/supabase/supabase/releases')
  //const restApiData = await response.json()

  async function fetchDiscussions(
    owner: string,
    repo: string,
    categoryId: string,
    last: number,
    cursor: string
  ) {
    const octokit = new ExtendedOctokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.SEARCH_GITHUB_APP_ID,
        installationId: process.env.SEARCH_GITHUB_APP_INSTALLATION_ID,
        privateKey: process.env.SEARCH_GITHUB_APP_PRIVATE_KEY,
      },
    })

    const query = `
      query troubleshootDiscussions($cursor: String, $owner: String!, $repo: String!, $categoryId: ID!, $first: Int) {
        repository(owner: $owner, name: $repo) {
          discussions(first: $first, ${
            forward ? 'after' : 'before'
          }: $cursor, categoryId: $categoryId, orderBy: { field: CREATED_AT, direction: DESC }) {
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
              # labels(first: 10) {
                # nodes {
                  # name
                # }
              # }
              # body, currently causing mdx rendering issues so disabled for the moment
            }
          }
        }
      }
    `
    const queryVars = {
      owner,
      repo,
      categoryId,
      first: perPage,
      cursor: next,
    }

    // fetch discussions
    const {
      repository: {
        discussions: { nodes: discussions, pageInfo },
      },
    } = await octokit.graphql<DiscussionsResponse>(query, queryVars)

    console.log({ pageInfo })
    return { discussions, pageInfo }
  }

  const { discussions, pageInfo } = await fetchDiscussions(
    'supabase',
    'supabase',
    'DIC_kwDODMpXOc4CAFUr', // 'Changelog' category
    perPage,
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
  const discussionsRender = await Promise.all(
    discussions.map(async (item: any): Promise<any> => {
      //console.log('discussion item', { item })
      const discussionsMdxSource: MDXRemoteSerializeResult = await mdxSerialize(item.body)

      return {
        ...item,
        source: discussionsMdxSource,
        type: 'discussion',
        created_at: item.createdAt,
        //labels: item.labels.nodes ?? [],
      }
    })
  )

  // Process restApiData
  // const restApiDataRender = await Promise.all(
  //   restApiData.map(async (item: any): Promise<any> => {
  //     //console.log('restapi item', { item })
  //     const restApiDataMdxSource: MDXRemoteSerializeResult = await mdxSerialize(item.body)

  //     return {
  //       ...item,
  //       source: restApiDataMdxSource,
  //       type: 'restData',
  //       created_at: item.created_at,
  //       title: item.name ?? '',
  //     }
  //   })
  // )

  // Combine discussionsRender and restApiDataRender into a single array
  //const combinedRenderArray = discussionsRender.concat(restApiDataRender)
  const combinedRenderArray = discussionsRender

  // Sort the combinedRenderArray by the created_at field in each entry
  combinedRenderArray.sort((a: any, b: any) => {
    const dateA = new Date(a.created_at)
    const dateB = new Date(b.created_at)
    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      return dateB.getTime() - dateA.getTime() // sort desc
    } else {
      return 0 // Handle invalid date values gracefully
    }
  })

  // combinedRenderArray.map((item) =>
  //   console.log(item.title, ' | ', item.type, ' | ', item.created_at, ' | ', item.labels)
  // )

  console.log('down here', { pageInfo })
  return {
    props: {
      changelog: combinedRenderArray,
      pageNumber,
      end: pageInfo.endCursor,
      start: pageInfo.startCursor,
    },
  }
}

function ChangelogPage({ changelog, end, start }: any) {
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
          {/* Title and description */}
          <div className="py-10">
            <h1 className="h1">Changelog</h1>
            <p className="text-foreground-lighter text-lg">New updates and product improvements</p>

            <div className="my-8">
              <h2>
                <Link href="http://localhost:3000/changelog">Pagination</Link>
              </h2>
              <Link href={`/changelog`}>back</Link>
              <Link href={`/changelog?forward=true&next=${end}`}>Next</Link>
            </div>
          </div>

          {/* Content */}
          <div>
            {changelog.length > 0 &&
              changelog
                .filter((changelogEntry: any) => !changelogEntry.title.includes('[d]'))
                .map((changelogEntry: any, i: number) => {
                  return (
                    <div
                      key={i}
                      className="border-muted grid border-l pb-10 lg:grid-cols-12 lg:gap-8"
                    >
                      <div
                        className="col-span-12 mb-8 self-start lg:sticky lg:top-0 lg:col-span-4 lg:-mt-32 lg:pt-32
                "
                      >
                        <div className="flex w-full items-baseline gap-6">
                          <div className="bg-border border-muted text-foreground-lighter -ml-2.5 flex h-5 w-5 items-center justify-center rounded border drop-shadow-sm">
                            <IconGitCommit size={14} strokeWidth={1.5} />
                          </div>
                          <div className="flex w-full flex-col gap-1">
                            {changelogEntry.title && (
                              <Link href={changelogEntry.url}>
                                <h3 className="text-foreground text-2xl">{changelogEntry.title}</h3>
                              </Link>
                            )}
                            <p className="text-muted text-lg">
                              {dayjs(changelogEntry.publishedAt).format('MMM D, YYYY')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="col-span-8 ml-8 lg:ml-0 max-w-[calc(100vw-80px)]">
                        <article className="prose prose-docs max-w-none">
                          <MDXRemote
                            {...changelogEntry.source}
                            components={mdxComponents('blog')}
                          />
                        </article>
                      </div>
                    </div>
                  )
                })}
          </div>
        </div>

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default ChangelogPage
