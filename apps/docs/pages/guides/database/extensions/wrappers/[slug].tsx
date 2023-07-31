import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import { GetStaticPaths, GetStaticProps } from 'next'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import { relative } from 'path'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import emoji from 'remark-emoji'
import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }
import components from '~/components'
import Layout from '~/layouts/DefaultGuideLayout'
import { UrlTransformFunction, linkTransform } from '~/lib/mdx/plugins/rehypeLinkTransform'
import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import { removeTitle } from '~/lib/mdx/plugins/remarkRemoveTitle'
import remarkPyMdownTabs from '~/lib/mdx/plugins/remarkTabs'

// We fetch these docs at build time from an external repo
const org = 'supabase'
const repo = 'wrappers'
const branch = 'main'
const docsDir = 'docs'
const externalSite = 'https://supabase.github.io/wrappers'

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
    slug: 's3',
    meta: {
      title: 'AWS S3',
    },
    remoteFile: 's3.md',
  },
  {
    slug: 'bigquery',
    meta: {
      title: 'BigQuery',
    },
    remoteFile: 'bigquery.md',
  },
  {
    slug: 'clickhouse',
    meta: {
      title: 'ClickHouse',
    },
    remoteFile: 'clickhouse.md',
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
    slug: 'stripe',
    meta: {
      title: 'Stripe',
    },
    remoteFile: 'stripe.md',
  },
]

interface WrappersDocsProps {
  source: MDXRemoteSerializeResult
  meta: {
    title: string
    description?: string
  }
}

export default function WrappersDocs({ source, meta }: WrappersDocsProps) {
  return (
    <Layout meta={meta}>
      <MDXRemote {...source} components={components} />
    </Layout>
  )
}

/**
 * Fetch markdown from external repo and transform links
 */
export const getStaticProps: GetStaticProps<WrappersDocsProps> = async ({ params }) => {
  const page = pageMap.find(({ slug }) => slug === params.slug)

  if (!page) {
    throw new Error(`No page mapping found for slug '${params.slug}'`)
  }

  const { remoteFile, meta } = page

  const response = await fetch(
    `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${docsDir}/${remoteFile}`
  )

  const source = await response.text()

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

  const codeHikeOptions: CodeHikeConfig = {
    theme: codeHikeTheme,
    lineNumbers: true,
    showCopyButton: true,
    skipLanguages: [],
    autoImport: false,
  }

  const mdxSource = await serialize(source, {
    scope: {
      chCodeConfig: codeHikeOptions,
    },
    mdxOptions: {
      remarkPlugins: [
        remarkGfm,
        remarkMkDocsAdmonition,
        emoji,
        remarkPyMdownTabs,
        [removeTitle, meta.title],
        [remarkCodeHike, codeHikeOptions],
      ],
      rehypePlugins: [[linkTransform, urlTransform], rehypeSlug],
    },
  })

  return { props: { source: mdxSource, meta } }
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: pageMap.map(({ slug }) => ({
      params: {
        slug,
      },
    })),
    fallback: false,
  }
}
