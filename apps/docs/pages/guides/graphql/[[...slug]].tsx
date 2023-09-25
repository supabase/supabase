import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import { GetStaticPaths, GetStaticProps } from 'next'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import { isAbsolute, relative } from 'path'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }
import components from '~/components'
import Layout from '~/layouts/DefaultGuideLayout'
import { UrlTransformFunction, linkTransform } from '~/lib/mdx/plugins/rehypeLinkTransform'
import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import { removeTitle } from '~/lib/mdx/plugins/remarkRemoveTitle'
import remarkPyMdownTabs from '~/lib/mdx/plugins/remarkTabs'

// We fetch these docs at build time from an external repo
const org = 'supabase'
const repo = 'pg_graphql'
const branch = 'master'
const docsDir = 'docs'
const externalSite = 'https://supabase.github.io/pg_graphql'

// Each external docs page is mapped to a local page
const pageMap = [
  {
    meta: {
      id: 'graphql-overview',
      title: 'GraphQL',
    },
    remoteFile: 'supabase.md',
  },
  {
    slug: 'api',
    meta: {
      id: 'graphql-api',
      title: 'GraphQL API',
    },
    remoteFile: 'api.md',
  },
]

interface PGGraphQLDocsProps {
  source: MDXRemoteSerializeResult
  meta: {
    title: string
    description?: string
  }
}

export default function PGGraphQLDocs({ source, meta }: PGGraphQLDocsProps) {
  return (
    <Layout meta={meta}>
      <MDXRemote {...source} components={components} />
    </Layout>
  )
}

/**
 * Fetch markdown from external repo and transform links
 */
export const getStaticProps: GetStaticProps<PGGraphQLDocsProps> = async ({ params }) => {
  const [slug] = params.slug ?? []
  const page = pageMap.find((page) => page.slug === slug)

  if (!page) {
    throw new Error(`No page mapping found for slug '${slug}'`)
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

      const getRelativePath = () => {
        if (pathname.endsWith('.md')) {
          return pathname.replace(/\.md$/, '')
        }
        if (isAbsolute(url)) {
          return relative(externalSiteUrl.pathname, pathname)
        }
        return pathname
      }

      const relativePath = getRelativePath().replace(/^\//, '')

      const page = pageMap.find(({ remoteFile }) => `${relativePath}.md` === remoteFile)

      // If we have a mapping for this page, use the mapped path
      if (page) {
        return page.slug + hash
      }

      // If we don't have this page in our docs, link to original docs
      return `${externalSite}/${relativePath}${hash}`
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
        slug: slug ? [slug] : [],
      },
    })),
    fallback: false,
  }
}
