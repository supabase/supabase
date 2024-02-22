import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import { GetStaticPaths, GetStaticProps } from 'next'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import { relative } from 'path'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }
import components from '~/components'
import Layout from '~/layouts/DefaultGuideLayout'
import { UrlTransformFunction, linkTransform } from '~/lib/mdx/plugins/rehypeLinkTransform'
import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import { removeTitle } from '~/lib/mdx/plugins/remarkRemoveTitle'
import remarkPyMdownTabs from '~/lib/mdx/plugins/remarkTabs'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'

// We fetch these docs at build time from an external repo
const org = 'supabase'
const repo = 'setup-cli'
const branch = 'gh-pages'
const docsDir = 'docs'
const externalSite = 'https://supabase.github.io/setup-cli'

// Each external docs page is mapped to a local page
const pageMap = [
  {
    slug: 'generating-types',
    meta: {
      title: 'Generate types using GitHub Actions',
      description: 'End-to-end type safety across client, server, and database.',
      subtitle: 'End-to-end type safety across client, server, and database.',
      tocVideo: 'VSNgAIObBdw',
    },
    remoteFile: 'generating-types.md',
  },
  {
    slug: 'testing',
    meta: {
      title: 'Automated testing using GitHub Actions',
      description: 'Run your tests when you or your team make changes.',
      subtitle: 'Run your tests when you or your team make changes.',
    },
    remoteFile: 'testing.md',
  },
  {
    slug: 'backups',
    meta: {
      title: 'Automated backups using GitHub Actions',
      description: 'Backup your database on a regular basis.',
      subtitle: 'Backup your database on a regular basis.',
    },
    remoteFile: 'backups.md',
  },
]

interface ActionDocsProps {
  source: MDXRemoteSerializeResult
  meta: {
    title: string
    description?: string
  }
}

export default function ActionDocs({ source, meta }: ActionDocsProps) {
  return (
    <Layout meta={meta} menuId={MenuId.Cli}>
      <MDXRemote {...source} components={components} />
    </Layout>
  )
}

/**
 * Fetch markdown from external repo and transform links
 */
export const getStaticProps: GetStaticProps<ActionDocsProps> = async ({ params }) => {
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
