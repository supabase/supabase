import { CodeHikeConfig, remarkCodeHike } from '@code-hike/mdx'
import matter from 'gray-matter'
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from 'next'
import { MDXRemote } from 'next-mdx-remote'
import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'

import codeHikeTheme from 'config/code-hike.theme.json' assert { type: 'json' }

import components from '~/components'
import { MenuId } from '~/components/Navigation/NavigationMenu/NavigationMenu'
import Layout from '~/layouts/DefaultGuideLayout'
import { isValidGuideFrontmatter } from '~/lib/docs'
import { UrlTransformFunction, linkTransform } from '~/lib/mdx/plugins/rehypeLinkTransform'
import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import { removeTitle } from '~/lib/mdx/plugins/remarkRemoveTitle'
import remarkPyMdownTabs from '~/lib/mdx/plugins/remarkTabs'

// We fetch these docs at build time from an external repo
export const org = 'supabase'
export const repo = 'terraform-provider-supabase'
export const branch = 'v1.1.3'
export const docsDir = 'docs'

// Each external docs page is mapped to a local page
const pageMap = [
  {
    remoteFile: 'README.md',
    meta: {
      title: 'Terraform Provider',
    },
    useRoot: true,
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
    <Layout menuId={MenuId.Platform} meta={meta} editLink={editLink}>
      <MDXRemote {...source} components={components} />
    </Layout>
  )
}

/**
 * The GitHub repo uses relative links, which don't lead to the right locations
 * in docs.
 *
 * @param url The original link, as written in the Markdown file
 * @returns The rewritten link
 */
const urlTransform: UrlTransformFunction = (url: string) => {
  try {
    const placeholderHostname = 'placeholder'
    const { hostname, pathname, hash } = new URL(url, `http://${placeholderHostname}`)

    // Don't modify a url with a FQDN or a url that's only a hash
    if (hostname !== placeholderHostname || pathname === '/') {
      return url
    }

    const getBasename = (pathname: string) =>
      pathname.endsWith('.md') ? pathname.replace(/\.md$/, '') : pathname
    const stripLeadingPrefix = (pathname: string) => pathname.replace(/^\//, '')
    const stripLeadingDocs = (pathname: string) => pathname.replace(/^docs\//, '')

    const relativePath = stripLeadingPrefix(getBasename(pathname))

    const page = pageMap.find(
      ({ remoteFile, useRoot }) =>
        (useRoot && `${relativePath}.md` === remoteFile) ||
        (!useRoot && `${stripLeadingDocs(relativePath)}.md` === remoteFile)
    )

    if (page) {
      return 'terraform' + `/${page.slug}` + hash
    }

    // If we don't have this page in our docs, link to GitHub repo
    return `https://github.com/${org}/${repo}/blob/${branch}${pathname}${hash}`
  } catch (err) {
    console.error('Error transforming markdown URL', err)
    return url
  }
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

  const { meta, remoteFile, useRoot } = page

  let response = await fetch(
    `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${useRoot ? '' : `${docsDir}/`}${remoteFile}`
  )

  let content = await response.text()
  // Strip out HTML comments
  content = content.replace(/<!--.*?-->/, '')
  const { content: source, data } = matter(content)
  Object.assign(meta, data)

  if (!isValidGuideFrontmatter(meta)) {
    throw Error('Guide frontmatter is invalid.')
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
