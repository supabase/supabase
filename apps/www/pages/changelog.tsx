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
    }
  }
}

export async function getStaticProps() {
  // const response = await fetch('https://api.github.com/repos/supabase/supabase/releases')
  // const data = await response.json()

  async function fetchDiscussions(owner: string, repo: string, categoryId: string) {
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
          discussions(first: 100, after: $cursor, categoryId: $categoryId, orderBy: { field: CREATED_AT, direction: DESC }) {
            totalCount
            nodes {
              id
              publishedAt
              createdAt
              url
              title
              # body, currently causing mdx rendering issues so disabled for the moment
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

    //     use this to find discussion category ids
    //     const result = await octokit.graphql.paginate<DiscussionsResponse>(
    //       `
    //       query {
    //   repository(owner: "supabase", name: "supabase") {
    //     discussionCategories(first: 100) {
    //       # type: DiscussionConnection
    //       totalCount # Int!
    //  pageInfo {
    //         # type: PageInfo (from the public schema)
    //         startCursor
    //         endCursor
    //         hasNextPage
    //         hasPreviousPage
    //       }
    //       nodes {
    //         # type: Discussion
    //         id
    //         name
    //       }
    //     }
    //   }
    // }
    //     `,
    //       {
    //         owner,
    //         repo,
    //         categoryId,
    //       }
    //     )

    //     // parse result as a string
    //     console.log('JSON.stringify', JSON.stringify(result, null, 2))
    return discussions
  }

  const discussions = await fetchDiscussions(
    'supabase',
    'supabase',
    'DIC_kwDODMpXOc4CAFUr' // 'Changelog' category
  )

  //console.log(discussions)

  if (!discussions) {
    return {
      props: {
        notFound: true,
      },
    }
  }

  const changelogRenderToString = await Promise.all(
    discussions.map(async (item: any): Promise<any> => {
      const mdxSource: MDXRemoteSerializeResult = await mdxSerialize(item.body)
      return {
        ...item,
        source: mdxSource,
      }
    })
  )

  return {
    props: {
      changelog: changelogRenderToString,
    },
  }
}

function ChangelogPage({ changelog }: any) {
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
          article: {
            //
            // to do: add expiration and modified dates
            // https://github.com/garmeeh/next-seo#article
            // publishedTime: props.blog.date,
          },
          // images: [
          //   {
          //     url: `https://supabase.com${basePath}/images/blog/${
          //       props.blog.image ? props.blog.image : props.blog.thumb
          //     }`,
          //   },
          // ],
        }}
      />
      <DefaultLayout>
        <div
          className="
            container mx-auto flex flex-col
            gap-20
            px-8 py-10 sm:px-16
            xl:px-20
          "
        >
          {/* Title and description */}
          <div className="py-10">
            <h1 className="h1">Changelog</h1>
            <p className="text-scale-900 text-lg">New updates and product improvements</p>
          </div>

          {/* Content */}
          <div>
            {changelog.map((changelog: any, i: number) => {
              return (
                <div
                  key={i}
                  className="border-scale-400 grid border-l pb-10 lg:grid-cols-12 lg:gap-8"
                >
                  <div
                    className="col-span-12 mb-8 self-start lg:sticky lg:top-0 lg:col-span-4 lg:-mt-32 lg:pt-32
                "
                  >
                    <div className="flex w-full items-baseline gap-6">
                      <div className="bg-scale-100 dark:bg-scale-500 border-scale-400 dark:border-scale-600 text-scale-900 -ml-2.5 flex h-5 w-5 items-center justify-center rounded border drop-shadow-sm">
                        <IconGitCommit size={14} strokeWidth={1.5} />
                      </div>
                      <div className="flex w-full flex-col gap-1">
                        {changelog.title && (
                          <h3 className="text-scale-1200 text-2xl">{changelog.title}</h3>
                        )}
                        <p className="text-scale-900 text-lg">
                          {dayjs(changelog.publishedAt).format('MMM D, YYYY')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-8 ml-8 lg:ml-0">
                    <article className="prose prose-docs max-w-none">
                      <MDXRemote {...changelog.source} components={mdxComponents('blog')} />
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
