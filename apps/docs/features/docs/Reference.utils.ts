import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import type { Metadata, ResolvingMetadata } from 'next'
import { redirect } from 'next/navigation'
import { visit } from 'unist-util-visit'

import { REFERENCES, clientSdkIds, selfHostingServices } from '~/content/navigation.references'
import { getFlattenedSections } from '~/features/docs/Reference.generated.singleton'
import { generateOpenGraphImageMeta } from '~/features/seo/openGraph'
import { BASE_PATH } from '~/lib/constants'

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
    let [sdkId, maybeVersion, maybeCrawlers, ...path] = slug
    if (!/v\d+/.test(maybeVersion)) {
      maybeVersion = null
      maybeCrawlers = maybeVersion
      path = [maybeCrawlers, ...path]
    }
    if (maybeCrawlers !== 'crawlers') {
      maybeCrawlers = null
      path = [maybeCrawlers, ...path]
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

  return flattenedSections
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
  ]

  const selfHostingPages = selfHostingServices.map((service) => ({
    slug: [REFERENCES[service].libPath],
  }))

  return [...sdkPages, ...cliPages, ...apiPages, ...selfHostingPages]
}

export async function generateReferenceMetadata(
  { params: { slug } }: { params: { slug: Array<string> } },
  resolvingParent: ResolvingMetadata
): Promise<Metadata> {
  const { alternates: parentAlternates, openGraph: parentOg } = await resolvingParent

  const parsedPath = parseReferencePath(slug)
  const isClientSdkReference = parsedPath.__type === 'clientSdk'
  const isCliReference = parsedPath.__type === 'cli'
  const isApiReference = parsedPath.__type === 'api'
  const isSelfHostingReference = parsedPath.__type === 'self-hosting'
  if (isClientSdkReference) {
    const { sdkId, maybeVersion } = parsedPath
    const version = maybeVersion ?? REFERENCES[sdkId].versions[0]

    const flattenedSections = await getFlattenedSections(sdkId, version)

    const displayName = REFERENCES[sdkId].name
    const sectionTitle =
      slug.length > 0
        ? flattenedSections.find((section) => section.slug === slug[0])?.title
        : undefined
    const url = [BASE_PATH, 'reference', sdkId, maybeVersion, slug[0]].filter(Boolean).join('/')

    const images = generateOpenGraphImageMeta({
      type: 'API Reference',
      title: `${displayName}${sectionTitle ? `: ${sectionTitle}` : ''}`,
    })

    return {
      title: `${displayName} API Reference | Supabase Docs`,
      description: `API reference for the ${displayName} Supabase SDK`,
      ...(slug.length > 0
        ? {
            alternates: {
              ...parentAlternates,
              canonical: url,
            },
          }
        : {}),
      openGraph: {
        ...parentOg,
        url,
        images,
      },
    }
  } else if (isCliReference) {
    return {
      title: 'CLI Reference | Supabase Docs',
      description: 'CLI reference for the Supabase CLI',
    }
  } else if (isApiReference) {
    return {
      title: 'Management API Reference | Supabase Docs',
      description: 'Management API reference for the Supabase API',
    }
  } else if (isSelfHostingReference) {
    return {
      title: 'Self-Hosting | Supabase Docs',
    }
  } else {
    return {}
  }
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
  const markdown = markdownUnescaped.replaceAll(/(?<!\\)\{/g, '\\{').replaceAll(/(?<!\\)\}/g, '\\}')

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
