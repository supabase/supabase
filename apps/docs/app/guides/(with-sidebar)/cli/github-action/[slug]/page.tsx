import { type SerializeOptions } from 'next-mdx-remote/dist/types'
import { notFound } from 'next/navigation'
import { relative } from 'node:path'
import rehypeSlug from 'rehype-slug'

import { genGuideMeta } from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
import { fetchRevalidatePerDay } from '~/features/helpers.fetch'
import { UrlTransformFunction, linkTransform } from '~/lib/mdx/plugins/rehypeLinkTransform'
import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import { removeTitle } from '~/lib/mdx/plugins/remarkRemoveTitle'
import remarkPyMdownTabs from '~/lib/mdx/plugins/remarkTabs'

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

type Params = { slug: string }

const ActionDocs = async ({ params }: { params: Params }) => {
  const { meta, ...data } = await getContent(params)

  const options = {
    mdxOptions: {
      remarkPlugins: [remarkMkDocsAdmonition, remarkPyMdownTabs, [removeTitle, meta.title]],
      rehypePlugins: [[linkTransform, urlTransform], rehypeSlug],
    },
  } as SerializeOptions

  return <GuideTemplate mdxOptions={options} meta={meta} {...data} />
}

/**
 * Fetch markdown from external repo
 */
const getContent = async ({ slug }: Params) => {
  const page = pageMap.find(({ slug: validSlug }) => validSlug && validSlug === slug)

  if (!page) {
    notFound()
  }

  const { remoteFile, meta } = page

  const editLink = newEditLink(`${org}/${repo}/blob/${branch}/${docsDir}/${remoteFile}`)

  const response = await fetchRevalidatePerDay(
    `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${docsDir}/${remoteFile}`
  )

  const content = await response.text()

  return {
    pathname: `/guides/cli/github-action/${slug}` satisfies `/${string}`,
    meta,
    content,
    editLink,
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

const generateStaticParams = () => pageMap.map(({ slug }) => ({ slug }))
const generateMetadata = genGuideMeta(getContent)

export default ActionDocs
export { generateStaticParams, generateMetadata }
