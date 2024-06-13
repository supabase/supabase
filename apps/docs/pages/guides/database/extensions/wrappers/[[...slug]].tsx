import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import { relative } from 'node:path'
import rehypeSlug from 'rehype-slug'
import emoji from 'remark-emoji'
import remarkGfm from 'remark-gfm'

import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }

import components from '~/components'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import Layout from '~/layouts/DefaultGuideLayout'
import { getGuidesStaticPaths, getGuidesStaticProps } from '~/lib/docs'
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
    slug: 'stripe',
    meta: {
      title: 'Stripe',
    },
    remoteFile: 'stripe.md',
  },
]

export default function WrappersDocs({
  source,
  meta,
  editLink,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout meta={meta} editLink={editLink} menuId={MenuId.Database}>
      <MDXRemote {...source} components={components} />
    </Layout>
  )
}

/**
 * Fetch markdown from external repo and transform links
 */
export const getStaticProps: GetStaticProps = async (args) => {
  const { params } = args
  const federatedPage = pageMap.find(({ slug }) => slug === params.slug.at(0))

  if (!federatedPage) {
    const { props } = await getGuidesStaticProps('database/extensions/wrappers', args)
    return {
      props: {
        source: props.mdxSource,
        meta: props.frontmatter,
      },
    }
  }

  const { remoteFile, meta } = federatedPage
  const repoPath = `${org}/${repo}/${branch}/${docsDir}/${remoteFile}`
  const repoEditPath = `${org}/${repo}/blob/${branch}/${docsDir}/${remoteFile}`
  const response = await fetch(`https://raw.githubusercontent.com/${repoPath}`)

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

  return { props: { source: mdxSource, meta, editLink: repoEditPath } }
}

export const getStaticPaths: GetStaticPaths = async () => {
  const mdxPaths = (await getGuidesStaticPaths('database/extensions/wrappers')).paths
  const federatedPaths = pageMap.map(({ slug }) => ({ params: { slug: [slug] } }))
  return {
    paths: [...federatedPaths, ...mdxPaths],
    fallback: false,
  }
}
