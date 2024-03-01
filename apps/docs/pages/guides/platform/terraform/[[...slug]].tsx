import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import matter from 'gray-matter'
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }

import components from '~/components'
import Layout from '~/layouts/DefaultGuideLayout'
import { isValidGuideFrontmatter } from '~/lib/docs'
import { UrlTransformFunction, linkTransform } from '~/lib/mdx/plugins/rehypeLinkTransform'
import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import { removeTitle } from '~/lib/mdx/plugins/remarkRemoveTitle'
import remarkPyMdownTabs from '~/lib/mdx/plugins/remarkTabs'

// We fetch these docs at build time from an external repo
const org = 'supabase'
const repo = 'terraform-provider-supabase'
const branch = 'main'
const docsDir = 'docs'

// Each external docs page is mapped to a local page
const pageMap = [
  {
    remoteFile: 'index.md',
    meta: {
      title: 'Terraform Provider',
    },
  },
  {
    slug: 'tutorial',
    remoteFile: 'tutorial.md',
    meta: {
      title: 'Using the Supabase Terraform Provider',
    },
  },
]

export default function TerraformDocs({
  source,
  meta,
  editLink,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout meta={meta} editLink={editLink}>
      <MDXRemote {...source} components={components} />
    </Layout>
  )
}

/**
 * Fetch markdown from external repo and transform links
 */
export const getStaticProps = (async ({ params }) => {
  const [slug] = params.slug ?? []
  const page = pageMap.find((page) => page.slug === slug)

  if (!page) {
    throw new Error(`No page mapping found for slug '${slug}'`)
  }

  const { meta, remoteFile } = page

  let response = await fetch(
    `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${docsDir}/${remoteFile}`
  )

  let content = await response.text()
  // Strip out HTML comments
  content = content.replace(/<!--.*?-->/, '')
  const { content: source, data } = matter(content)
  Object.assign(meta, data)

  if (!isValidGuideFrontmatter(meta)) {
    throw Error('Guide frontmatter is invalid.')
  }

  const urlTransform: UrlTransformFunction = (url) => {
    try {
      const placeholderHostname = 'placeholder'
      const { hostname, pathname, hash } = new URL(url, `http://${placeholderHostname}`)

      // Don't modify a url with a FQDN
      if (hostname !== placeholderHostname) {
        return url
      }

      const page = pageMap.find(
        ({ remoteFile }) => `${pathname.replace(/^\//, '')}.md` === remoteFile
      )

      // If we have a mapping for this page, use the mapped path
      if (page) {
        return 'terraform/' + page.slug + hash
      }

      throw Error("We don't have this page.")
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

  return {
    props: {
      source: mdxSource,
      meta,
      editLink: `${org}/${repo}/blob/${branch}/${docsDir}/${slug}.md`,
    },
  }
}) satisfies GetStaticProps

export const getStaticPaths = (async () => {
  return {
    paths: pageMap.map(({ slug }) => ({
      params: {
        slug: slug ? [slug] : [],
      },
    })),
    fallback: false,
  }
}) satisfies GetStaticPaths
