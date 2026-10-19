import { clientSdkIds, REFERENCES, selfHostingServices } from '~/content/navigation.references'
import { getFlattenedSections } from '~/features/docs/Reference.generated.singleton'
import { generateOpenGraphImageMeta } from '~/features/seo/openGraph'
import type { BreadcrumbItem } from '~/lib/breadcrumbs'
import { BASE_PATH, PROD_URL } from '~/lib/constants'
import { getCustomContent } from '~/lib/custom-content/getCustomContent'
import { breadcrumbListSchema, techArticleSchema } from '~/lib/json-ld'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { mdxjs } from 'micromark-extension-mdxjs'
import type { Metadata, ResolvingMetadata } from 'next'
import { redirect } from 'next/navigation'
import { visit } from 'unist-util-visit'

const { metadataTitle } = getCustomContent(['metadata:title'])

export interface AbbrevApiReferenceSection {
  id: string
  type: string
  title?: string
  slug?: string
  items?: Array<AbbrevApiReferenceSection>
  excludes?: Array<string>
  meta?: {
    shared?: boolean
  }
}

export function parseReferencePath(slug: Array<string>) {
  const isClientSdkReference = clientSdkIds.includes(slug[0])
  const isCliReference = slug[0] === 'cli'
  const isApiReference = slug[0] === 'api'
  const isSelfHostingReference = slug[0].startsWith('self-hosting-')

  if (isClientSdkReference) {
    let sdkId: string
    let maybeVersion: string | null
    let maybeCrawlers: string | null
    let path: string[]
    ;[sdkId, maybeVersion, maybeCrawlers, ...path] = slug
    if (!/^v\d+$/.test(maybeVersion)) {
      maybeVersion = null
      path = [maybeCrawlers, ...path]
      maybeCrawlers = maybeVersion
    }
    if (maybeCrawlers !== 'crawlers') {
      if (typeof maybeCrawlers === 'string') {
        path = [maybeCrawlers, ...path]
      }
      maybeCrawlers = null
    }

    return {
      __type: 'clientSdk' as const,
      sdkId,
      maybeVersion,
      maybeCrawlers,
      path,
    }
  } else if (isCliReference) {
    return {
      __type: 'cli' as const,
      path: slug.slice(1),
    }
  } else if (isApiReference) {
    return {
      __type: 'api' as const,
      path: slug.slice(1),
    }
  } else if (isSelfHostingReference) {
    return {
      __type: 'self-hosting' as const,
      service: slug[0].replace('self-hosting-', ''),
      servicePath: slug[0],
      path: slug.slice(1),
    }
  } else {
    return {
      __type: 'UNIMPLEMENTED' as const,
    }
  }
}

async function generateStaticParamsForSdkVersion(sdkId: string, version: string) {
  const flattenedSections = await getFlattenedSections(sdkId, version)

  return (flattenedSections || [])
    .filter((section) => section.type !== 'category' && !!section.slug)
    .map((section) => ({
      slug: [
        sdkId,
        version === REFERENCES[sdkId].versions[0] ? null : version,
        'crawlers',
        section.slug,
      ].filter(Boolean),
    }))
}

// Spike (DOCS-1268): one static page per Management API endpoint, in addition
// to the existing bare `/reference/api` monolith. Deliberately does not reuse
// generateStaticParamsForSdkVersion's output shape — that function bakes in a
// 'crawlers' path segment for a separate crawler-only mechanism unrelated to
// these human-facing per-operation URLs.
async function generateStaticParamsForApi() {
  const flattenedSections = await getFlattenedSections('api', 'latest')

  return (flattenedSections || [])
    .filter((section) => section.type !== 'category' && !!section.slug)
    .map((section) => ({
      slug: ['api', section.slug],
    }))
}

export async function generateReferenceStaticParams() {
  const sdkPages = clientSdkIds
    .flatMap((sdkId) =>
      REFERENCES[sdkId].versions.map((version) => ({
        sdkId,
        version,
      }))
    )
    .map(({ sdkId, version }) => ({
      slug: [sdkId, version === REFERENCES[sdkId].versions[0] ? null : version].filter(Boolean),
    }))

  const cliPages = [
    {
      slug: ['cli'],
    },
  ]

  const apiPages = [
    {
      slug: ['api'],
    },
    ...(await generateStaticParamsForApi()),
  ]

  const selfHostingPages = selfHostingServices.map((service) => ({
    slug: [REFERENCES[service].libPath],
  }))

  return [...sdkPages, ...cliPages, ...apiPages, ...selfHostingPages]
}

async function getSectionTitle(sdkId: string, version: string, sectionSlug: string | undefined) {
  if (!sectionSlug) return undefined
  const flattenedSections = await getFlattenedSections(sdkId, version)
  return flattenedSections?.find((section) => section.slug === sectionSlug)?.title
}

interface ReferencePageInfo {
  pathname: string
  title: string
  description?: string
  ogTitle?: string
  canonical?: boolean
  leafName: string
  parentCrumbs: BreadcrumbItem[]
}

async function getReferencePageInfo(slug: Array<string>): Promise<ReferencePageInfo | null> {
  const parsedPath = parseReferencePath(slug)

  switch (parsedPath.__type) {
    case 'clientSdk': {
      const { sdkId, maybeVersion, path } = parsedPath
      const version = maybeVersion ?? REFERENCES[sdkId].versions[0]
      const displayName = REFERENCES[sdkId].name
      const sectionTitle = await getSectionTitle(sdkId, version, path[0])

      return {
        pathname: `/reference/${sdkId}${path[0] ? `/${path[0]}` : ''}`,
        title: `${displayName} API Reference | ${metadataTitle || 'Supabase'}`,
        description: `API reference for the ${displayName} Supabase SDK`,
        ogTitle: `${displayName}${sectionTitle ? `: ${sectionTitle}` : ''}`,
        canonical: true,
        leafName: sectionTitle ?? displayName,
        parentCrumbs: path[0] ? [{ name: displayName, url: `/reference/${sdkId}` }] : [],
      }
    }
    case 'cli':
      return {
        pathname: '/reference/cli',
        title: 'CLI Reference | Supabase Docs',
        description: 'CLI reference for the Supabase CLI',
        leafName: 'CLI',
        parentCrumbs: [],
      }
    case 'api': {
      const operationSlug = parsedPath.path[0]
      const sectionTitle = await getSectionTitle('api', 'latest', operationSlug)
      const sectionSuffix = sectionTitle ? `: ${sectionTitle}` : ''

      return {
        pathname: operationSlug ? `/reference/api/${operationSlug}` : '/reference/api',
        title: `${sectionTitle ? `${sectionTitle} | ` : ''}Management API Reference | Supabase Docs`,
        description: `Management API reference for the Supabase API${sectionSuffix}`,
        ogTitle: `Management API${sectionSuffix}`,
        canonical: Boolean(operationSlug),
        leafName: operationSlug ? (sectionTitle ?? operationSlug) : 'Management API',
        parentCrumbs: operationSlug ? [{ name: 'Management API', url: '/reference/api' }] : [],
      }
    }
    case 'self-hosting': {
      const name = REFERENCES[parsedPath.servicePath.replaceAll('-', '_')].name

      return {
        pathname: `/reference/${slug.join('/')}`,
        title: 'Self-Hosting | Supabase Docs',
        leafName: name,
        parentCrumbs: [],
      }
    }
    default:
      return null
  }
}

export async function generateReferenceMetadata(
  props: { params: Promise<{ slug: Array<string> }> },
  resolvingParent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await props.params
  const { openGraph: parentOg } = await resolvingParent

  const page = await getReferencePageInfo(slug)
  if (!page) return {}
  if (!page.ogTitle) return { title: page.title, description: page.description }

  const url = `${BASE_PATH}${page.pathname}`
  return {
    title: page.title,
    description: page.description,
    ...(page.canonical ? { alternates: { canonical: url } } : {}),
    openGraph: {
      ...parentOg,
      url,
      images: generateOpenGraphImageMeta({ type: 'API Reference', title: page.ogTitle }),
    },
  }
}

export async function generateReferenceJsonLd(slug: Array<string>) {
  const page = await getReferencePageInfo(slug)
  if (!page) return null

  const pageSchema = techArticleSchema({
    url: `${PROD_URL}${page.pathname}`,
    headline: page.title,
    description: page.description,
  })
  const breadcrumbSchema = breadcrumbListSchema({
    pathname: page.pathname,
    chain: [
      { name: 'API Reference', url: '/reference' },
      ...page.parentCrumbs,
      { name: page.leafName, url: page.pathname },
    ],
  })

  return breadcrumbSchema ? [pageSchema, breadcrumbSchema] : [pageSchema]
}

export async function redirectNonexistentReferenceSection(
  sdkId: string,
  version: string,
  path: Array<string>,
  isLatestVersion: boolean
) {
  const initialSelectedSection = path[0]

  const validSlugs = await generateStaticParamsForSdkVersion(sdkId, version)

  if (
    initialSelectedSection &&
    !validSlugs.some((params) => params.slug[0] === initialSelectedSection)
  ) {
    redirect(`/reference/${sdkId}` + (!isLatestVersion ? '/' + version : ''))
  }
}

export function normalizeMarkdown(markdownUnescaped: string): string {
  /**
   * Need to first escape the braces so that the MDX parser doesn't choke on
   * them. Unlike the MDX parser, the regular Markdown parser handles braces
   * gracefully, so we use it to find the positions of the code blocks, then
   * escape all other braces before the final conversion with the MDX parser.
   */
  const markdownTree = fromMarkdown(markdownUnescaped)

  const codeBlocks = [] as Array<{
    type: string
    start: number
    end: number
  }>
  visit(markdownTree, ['code', 'inlineCode'], (node) => {
    codeBlocks.push({
      type: node.type,
      start: node.position?.start?.offset || 0,
      end: node.position?.end?.offset || 0,
    })
  })
  // Sort code blocks by start offset in descending order
  codeBlocks.sort((a, b) => b.start - a.start)

  let markdown = markdownUnescaped
  let lastIndex = markdown.length

  // Iterate through the sorted code blocks
  for (const block of codeBlocks) {
    // Escape braces in the text between the current code block and the last processed position
    const textBetween = markdown.slice(block.end, lastIndex)
    const escapedTextBetween = textBetween.replace(/(?<!\\)([{}])/g, '\\$1')

    // Replace the original text with the escaped version
    markdown = markdown.slice(0, block.end) + escapedTextBetween + markdown.slice(lastIndex)

    // Update the last processed position
    lastIndex = block.start
  }

  // Escape braces in the remaining text before the first code block
  if (lastIndex > 0) {
    const remainingText = markdown.slice(0, lastIndex)
    const escapedRemainingText = remainingText.replace(/(?<!\\)([{}])/g, '\\$1')
    markdown = escapedRemainingText + markdown.slice(lastIndex)
  }

  const mdxTree = fromMarkdown(markdown, {
    extensions: [mdxjs()],
    mdastExtensions: [mdxFromMarkdown()],
  })
  visit(mdxTree, 'text', (node) => {
    node.value = node.value.replace(/\n/g, ' ')
  })
  const content = toMarkdown(mdxTree, {
    extensions: [mdxToMarkdown()],
  })

  return content
}

export { SUPPORTS_NEW_REFERENCE_PROCESS } from '~/features/docs/Reference.constants'
