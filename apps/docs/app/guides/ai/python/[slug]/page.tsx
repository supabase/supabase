import { type SerializeOptions } from 'next-mdx-remote/dist/types'
import { redirect } from 'next/navigation'
import { relative } from 'path'
import rehypeSlug from 'rehype-slug'
import { genGuideMeta } from '~/features/docs/GuidesMdx.utils'
import { GuideTemplate, newEditLink } from '~/features/docs/GuidesMdx.template'
import { fetchRevalidatePerDay } from '~/features/helpers.fetch'
import { notFoundLink } from '~/features/recommendations/NotFound.utils'
import { UrlTransformFunction, linkTransform } from '~/lib/mdx/plugins/rehypeLinkTransform'
import remarkMkDocsAdmonition from '~/lib/mdx/plugins/remarkAdmonition'
import { removeTitle } from '~/lib/mdx/plugins/remarkRemoveTitle'

// We fetch these docs at build time from an external repo
const org = 'supabase'
const repo = 'vecs'
const branch = 'main'
const docsDir = 'docs'
const externalSite = 'https://supabase.github.io/vecs'

// Each external docs page is mapped to a local page
const pageMap = [
  {
    slug: 'api',
    meta: {
      title: 'API',
    },
    remoteFile: 'api.md',
  },
  {
    slug: 'collections',
    meta: {
      title: 'Collections',
    },
    remoteFile: 'concepts_collections.md',
  },
  {
    slug: 'indexes',
    meta: {
      title: 'Indexes',
    },
    remoteFile: 'concepts_indexes.md',
  },
  {
    slug: 'metadata',
    meta: {
      title: 'Metadata',
    },
    remoteFile: 'concepts_metadata.md',
  },
]

interface Params {
  slug: string
}

const PythonClientDocs = async ({ params }: { params: Params }) => {
  const { meta, ...data } = await getContent(params)

  const options = {
    mdxOptions: {
      remarkPlugins: [remarkMkDocsAdmonition, [removeTitle, meta.title]],
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
    redirect(notFoundLink(`api/python/${slug}`))
  }

  const { remoteFile, meta } = page

  const editLink = newEditLink(`${org}/${repo}/blob/${branch}/${docsDir}/${remoteFile}`)

  const response = await fetchRevalidatePerDay(
    `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${docsDir}/${remoteFile}`
  )

  const content = await response.text()

  return {
    pathname: `/guides/ai/python/${slug}` satisfies `/${string}`,
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

export default PythonClientDocs
export { generateStaticParams, generateMetadata }
