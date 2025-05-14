import matter from 'gray-matter'
import { type SerializeOptions } from 'next-mdx-remote/dist/types'
import { readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import rehypeSlug from 'rehype-slug'
import emoji from 'remark-emoji'
import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
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

export const dynamicParams = false

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
    },
    remoteFile: 'airtable.md',
  },
  {
    slug: 'auth0',
    meta: {
      title: 'Auth0',
    },
    remoteFile: 'auth0.md',
  },
  {
    slug: 'bigquery',
    meta: {
      title: 'BigQuery',
    },
    remoteFile: 'bigquery.md',
  },
  {
    slug: 'clerk',
    meta: {
      title: 'Clerk',
    },
    remoteFile: 'clerk.md',
  },
  {
    slug: 'clickhouse',
    meta: {
      title: 'ClickHouse',
    },
    remoteFile: 'clickhouse.md',
  },
  {
    slug: 'cognito',
    meta: {
      title: 'AWS Cognito',
    },
    remoteFile: 'cognito.md',
  },
  {
    slug: 'firebase',
    meta: {
      title: 'Firebase',
    },
    remoteFile: 'firebase.md',
  },
  {
    slug: 'logflare',
    meta: {
      title: 'Logflare',
    },
    remoteFile: 'logflare.md',
  },
  {
    slug: 'mssql',
    meta: {
      title: 'MSSQL',
    },
    remoteFile: 'mssql.md',
  },
  {
    slug: 'notion',
    meta: {
      title: 'Notion',
    },
    remoteFile: 'notion.md',
  },
  {
    slug: 'paddle',
    meta: {
      title: 'Paddle',
    },
    remoteFile: 'paddle.md',
  },
  {
    slug: 'redis',
    meta: {
      title: 'Redis',
    },
    remoteFile: 'redis.md',
  },
  {
    slug: 's3',
    meta: {
      title: 'AWS S3',
    },
    remoteFile: 's3.md',
  },
  {
    slug: 'snowflake',
    meta: {
      title: 'Snowflake',
    },
    remoteFile: 'snowflake.md',
  },
  {
    slug: 'stripe',
    meta: {
      title: 'Stripe',
    },
    remoteFile: 'stripe.md',
  },
]

interface Params {
  slug?: string[]
}

const WrappersDocs = async (props: { params: Promise<Params> }) => {
  const params = await props.params
  const { isExternal, meta, ...data } = await getContent(params)

  const options = isExternal
    ? ({
        mdxOptions: {
          remarkPlugins: [
            remarkMkDocsAdmonition,
            emoji,
            remarkPyMdownTabs,
            [removeTitle, meta.title],
          ],
          rehypePlugins: [[linkTransform, urlTransform], rehypeSlug],
        },
      } as SerializeOptions)
    : undefined

  return <GuideTemplate meta={meta} mdxOptions={options} {...data} />
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
  }
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
  const mdxPaths = await genGuidesStaticParams('database/extensions/wrappers')()
  const federatedPaths = pageMap.map(({ slug }) => ({
    slug: [slug],
  }))

  return [...mdxPaths, ...federatedPaths]
}

const generateMetadata = genGuideMeta(getContent)

export default WrappersDocs
export { generateMetadata, generateStaticParams }
