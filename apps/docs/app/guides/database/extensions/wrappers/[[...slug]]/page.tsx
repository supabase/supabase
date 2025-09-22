import matter from 'gray-matter'
import { readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import rehypeSlug from 'rehype-slug'
import emoji from 'remark-emoji'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns'

import { Guide, GuideArticle, GuideHeader, GuideFooter, GuideMdxContent } from '~/features/ui/guide'
import { newEditLink } from '~/features/helpers.edit-link'
import {
  genGuideMeta,
  genGuidesStaticParams,
  removeRedundantH1,
} from '~/features/docs/GuidesMdx.utils'
import { REVALIDATION_TAGS } from '~/features/helpers.fetch'
import { GUIDES_DIRECTORY, isValidGuideFrontmatter } from '~/lib/docs'
import { UrlTransformFunction, linkTransform } from '~/lib/mdx/plugins/rehypeLinkTransform'
import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import { removeTitle } from '~/lib/mdx/plugins/remarkRemoveTitle'
import remarkPyMdownTabs from '~/lib/mdx/plugins/remarkTabs'
import { octokit } from '~/lib/octokit'
import { SerializeOptions } from '~/types/next-mdx-remote-serialize'
import { IS_PROD } from 'common'

// We fetch these docs at build time from an external repo
const org = 'supabase'
const repo = 'wrappers'
const docsDir = 'docs/catalog'
const externalSite = 'https://supabase.github.io/wrappers'

type TagQueryResponse = {
  repository: {
    refs: {
      nodes:
        | {
            name: string
          }[]
        | null
      pageInfo: {
        hasNextPage: boolean
        endCursor: string | null
      }
    }
  }
}

const tagQuery = `
    query TagQuery($owner: String!, $name: String!, $after: String) {
      repository(owner: $owner, name: $name) {
        refs(
          refPrefix: "refs/tags/",
          orderBy: {
            field: TAG_COMMIT_DATE,
            direction: DESC
          },
          first: 5,
          after: $after
        ) {
          nodes {
            name
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `

async function getLatestRelease(after: string | null = null) {
  try {
    const {
      repository: {
        refs: {
          nodes,
          pageInfo: { hasNextPage, endCursor },
        },
      },
    } = await octokit().graphql<TagQueryResponse>(tagQuery, {
      owner: org,
      name: repo,
      after,
      request: {
        fetch: (url: RequestInfo | URL, options?: RequestInit) =>
          fetch(url, { ...options, next: { tags: [REVALIDATION_TAGS.WRAPPERS] } }),
      },
    })

    return (
      nodes?.find((node) => node?.name?.match(/^docs_v\d+\.\d+\.\d+/))?.name ??
      (hasNextPage && endCursor ? await getLatestRelease(endCursor) : null)
    )
  } catch (error) {
    console.error(`Error fetching release tags for wrappers federated pages: ${error}`)
    return null
  }
}

// Each external docs page is mapped to a local page
const pageMap = [
  {
    slug: 'airtable',
    meta: {
      title: 'Airtable',
      dashboardIntegrationPath: 'airtable_wrapper',
    },
    remoteFile: 'airtable.md',
  },
  {
    slug: 'auth0',
    meta: {
      title: 'Auth0',
      dashboardIntegrationPath: 'auth0_wrapper',
    },
    remoteFile: 'auth0.md',
  },
  {
    slug: 'bigquery',
    meta: {
      title: 'BigQuery',
      dashboardIntegrationPath: 'bigquery_wrapper',
    },
    remoteFile: 'bigquery.md',
  },
  {
    slug: 'clerk',
    meta: {
      title: 'Clerk',
      dashboardIntegrationPath: 'clerk_wrapper',
    },
    remoteFile: 'clerk.md',
  },
  {
    slug: 'clickhouse',
    meta: {
      title: 'ClickHouse',
      dashboardIntegrationPath: 'clickhouse_wrapper',
    },
    remoteFile: 'clickhouse.md',
  },
  {
    slug: 'cognito',
    meta: {
      title: 'AWS Cognito',
      dashboardIntegrationPath: 'cognito_wrapper',
    },
    remoteFile: 'cognito.md',
  },
  {
    slug: 'duckdb',
    meta: {
      title: 'DuckDB',
    },
    remoteFile: 'duckdb.md',
  },
  {
    slug: 'firebase',
    meta: {
      title: 'Firebase',
      dashboardIntegrationPath: 'firebase_wrapper',
    },
    remoteFile: 'firebase.md',
  },
  {
    slug: 'iceberg',
    meta: {
      title: 'Iceberg',
      dashboardIntegrationPath: 'iceberg_wrapper',
    },
    remoteFile: 'iceberg.md',
  },
  {
    slug: 'logflare',
    meta: {
      title: 'Logflare',
      dashboardIntegrationPath: 'logflare_wrapper',
    },
    remoteFile: 'logflare.md',
  },
  {
    slug: 'mssql',
    meta: {
      title: 'MSSQL',
      dashboardIntegrationPath: 'mssql_wrapper',
    },
    remoteFile: 'mssql.md',
  },
  {
    slug: 'notion',
    meta: {
      title: 'Notion',
      dashboardIntegrationPath: 'notion_wrapper',
    },
    remoteFile: 'notion.md',
  },
  {
    slug: 'paddle',
    meta: {
      title: 'Paddle',
      dashboardIntegrationPath: 'paddle_wrapper',
    },
    remoteFile: 'paddle.md',
  },
  {
    slug: 'redis',
    meta: {
      title: 'Redis',
      dashboardIntegrationPath: 'redis_wrapper',
    },
    remoteFile: 'redis.md',
  },
  {
    slug: 's3',
    meta: {
      title: 'AWS S3',
      dashboardIntegrationPath: 's3_wrapper',
    },
    remoteFile: 's3.md',
  },
  {
    slug: 'snowflake',
    meta: {
      title: 'Snowflake',
      dashboardIntegrationPath: 'snowflake_wrapper',
    },
    remoteFile: 'snowflake.md',
  },
  {
    slug: 'stripe',
    meta: {
      title: 'Stripe',
      dashboardIntegrationPath: 'stripe_wrapper',
    },
    remoteFile: 'stripe.md',
  },
]

interface Params {
  slug?: string[]
}

const WrappersDocs = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const { isExternal, meta, assetsBaseUrl, ...data } = await getContent(params)

  // Create a combined URL transformer that handles both regular URLs and asset URLs
  const combinedUrlTransformer: UrlTransformFunction = (url, node) => {
    // First try assets URL transformation (starts with ../assets/)
    const transformedUrl = assetUrlTransform(url, assetsBaseUrl)

    // If URL wasn't changed proceed with regular URL transformation
    if (transformedUrl === url) {
      return urlTransform(url, node)
    }

    return transformedUrl
  }

  const options = isExternal
    ? ({
        mdxOptions: {
          remarkPlugins: [
            remarkMkDocsAdmonition,
            emoji,
            remarkPyMdownTabs,
            [removeTitle, meta.title],
          ],
          rehypePlugins: [[linkTransform, combinedUrlTransformer], rehypeSlug],
        },
      } as SerializeOptions)
    : undefined

  const dashboardIntegrationURL = getDashboardIntegrationURL(meta.dashboardIntegrationPath)

  return (
    <Guide meta={meta}>
      <GuideArticle>
        <GuideHeader />

        {dashboardIntegrationURL && (
          <Admonition type="tip" className="mb-4">
            <p>You can enable the {meta.title} wrapper right from the Supabase dashboard.</p>

            <Button asChild>
              <Link href={dashboardIntegrationURL} className="no-underline">
                Open wrapper in dashboard
              </Link>
            </Button>
          </Admonition>
        )}

        <GuideMdxContent content={data.content} mdxOptions={options} />

        <GuideFooter editLink={data.editLink} />
      </GuideArticle>
    </Guide>
  )
}

/**
 * Fetch markdown from external repo
 */
const getContent = async (params: Params) => {
  const federatedPage = pageMap.find(
    ({ slug }) => params && slug && params.slug && slug === params.slug.at(0)
  )

  let isExternal: boolean
  let meta: any
  let content: string
  let editLink: string
  let assetsBaseUrl: string = ''

  if (!federatedPage) {
    isExternal = false
    editLink = `supabase/supabase/apps/docs/content/guides/database/extensions/wrappers${params.slug?.length ? `/${params.slug.join('/')}` : ''}.mdx`
    const rawContent = await readFile(
      join(
        GUIDES_DIRECTORY,
        'database',
        'extensions',
        `wrappers${params.slug?.length ? `/${params.slug.join('/')}` : ''}.mdx`
      ),
      'utf-8'
    )
    ;({ data: meta, content } = matter(rawContent))
    if (!isValidGuideFrontmatter(meta)) {
      throw Error(`Expected valid frontmatter, got ${JSON.stringify(meta, null, 2)}`)
    }
  } else {
    isExternal = true
    let remoteFile: string
    ;({ remoteFile, meta } = federatedPage)

    const tag = await getLatestRelease()
    if (!tag) {
      throw new Error('No latest release found for federated wrappers pages')
    }

    const repoPath = `${org}/${repo}/${tag}/${docsDir}/${remoteFile}`
    editLink = `${org}/${repo}/blob/${tag}/${docsDir}/${remoteFile}`

    const response = await fetch(`https://raw.githubusercontent.com/${repoPath}`, {
      cache: 'force-cache',
      next: { tags: [REVALIDATION_TAGS.WRAPPERS] },
    })
    const rawContent = await response.text()

    assetsBaseUrl = `https://raw.githubusercontent.com/${org}/${repo}/${tag}/docs/assets/`

    const { content: contentWithoutFrontmatter } = matter(rawContent)
    content = removeRedundantH1(contentWithoutFrontmatter)
  }

  return {
    pathname:
      `/guides/database/extensions/wrappers${params.slug?.length ? `/${params.slug.join('/')}` : ''}` satisfies `/${string}`,
    isExternal,
    editLink: newEditLink(editLink),
    meta,
    content,
    assetsBaseUrl,
  }
}

const getDashboardIntegrationURL = (wrapperPath?: string) => {
  return wrapperPath
    ? `https://supabase.com/dashboard/project/_/integrations/${wrapperPath}/overview`
    : null
}

const assetUrlTransform = (url: string, baseUrl: string): string => {
  const assetPattern = /(\.\.\/)+assets\//

  if (assetPattern.test(url)) {
    return url.replace(assetPattern, baseUrl)
  }

  return url
}

const urlTransform: UrlTransformFunction = (url) => {
  try {
    const externalSiteUrl = new URL(externalSite)

    const placeholderHostname = 'placeholder'
    const { hostname, pathname, hash } = new URL(url, `http://${placeholderHostname}`)

    // Don't modify a url with a FQDN or a url that's only a hash
    if (hostname !== placeholderHostname || pathname === '/') {
      return url
    }
    const relativePage = (
      pathname.endsWith('.md')
        ? pathname.replace(/\.md$/, '')
        : relative(externalSiteUrl.pathname, pathname)
    ).replace(/^\//, '')

    const page = pageMap.find(({ remoteFile }) => `${relativePage}.md` === remoteFile)

    // If we have a mapping for this page, use the mapped path
    if (page) {
      return page.slug + hash
    }

    // If we don't have this page in our docs, link to original docs
    return `${externalSite}/${relativePage}${hash}`
  } catch (err) {
    console.error('Error transforming markdown URL', err)
    return url
  }
}

const generateStaticParams = async () => {
  if (IS_PROD) {
    return []
  }

  const mdxPaths = await genGuidesStaticParams('database/extensions/wrappers')()
  const federatedPaths = pageMap.map(({ slug }) => ({
    slug: [slug],
  }))

  return [...mdxPaths, ...federatedPaths]
}

const generateMetadata = genGuideMeta(getContent)

export default WrappersDocs
export { generateMetadata, generateStaticParams }
