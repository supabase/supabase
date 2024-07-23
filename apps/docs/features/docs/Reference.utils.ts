import { isPlainObject } from 'lodash'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import type { Metadata, ResolvingMetadata } from 'next'
import { redirect } from 'next/navigation'
import { readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { visit } from 'unist-util-visit'
import { parse } from 'yaml'

import { REFERENCES, clientSdkIds } from '~/content/navigation.references'
import { deepFilterRec } from '~/features/helpers.fn'
import type { Json } from '~/features/helpers.types'
import { cache_fullProcess_withDevCacheBust } from '~/features/helpers.fs'
import { generateOpenGraphImageMeta } from '~/features/seo/openGraph'
import { BASE_PATH } from '~/lib/constants'
import { SPEC_DIRECTORY } from '~/lib/docs'
import commonClientLibSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }

export function parseReferencePath(slug: Array<string>) {
  const isClientSdkReference = clientSdkIds.includes(slug[0])

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
  } else {
    return {
      __type: 'UNIMPLEMENTED' as const,
    }
  }
}

async function generateStaticParamsForSdkVersion(
  sdkId: string,
  version: string,
  maybeSpecFile?: string,
  maybeExcludeName?: string
) {
  const specFile = maybeSpecFile ?? REFERENCES[sdkId].meta[version].specFile
  const excludeName = maybeExcludeName ?? REFERENCES[sdkId].meta[version].excludeName

  const sectionTree = await genClientSdkSectionTree(specFile, excludeName)
  const flattenedSections = flattenCommonClientLibSections(sectionTree)

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
  const crawlerPages = clientSdkIds
    .flatMap((sdkId) =>
      REFERENCES[sdkId].versions.map((version) => ({
        sdkId,
        version,
        specFile: REFERENCES[sdkId].meta[version].specFile,
        excludeName: REFERENCES[sdkId].meta[version].excludeName,
      }))
    )
    .map(async ({ sdkId, version, specFile, excludeName }) => {
      return generateStaticParamsForSdkVersion(sdkId, version, specFile, excludeName)
    })

  const nonCrawlerPages = clientSdkIds
    .flatMap((sdkId) =>
      REFERENCES[sdkId].versions.map((version) => ({
        sdkId,
        version,
      }))
    )
    .map(({ sdkId, version }) => ({
      slug: [sdkId, version === REFERENCES[sdkId].versions[0] ? null : version].filter(Boolean),
    }))

  return nonCrawlerPages.concat((await Promise.all(crawlerPages)).flat())
}

export async function generateReferenceMetadata(
  { params: { slug } }: { params: { slug: Array<string> } },
  resolvingParent: ResolvingMetadata
): Promise<Metadata> {
  const { alternates: parentAlternates, openGraph: parentOg } = await resolvingParent
  const flattenedSections = flattenCommonClientLibSections(
    commonClientLibSections as Array<AbbrevCommonClientLibSection>
  )

  const parsedPath = parseReferencePath(slug)
  const isClientSdkReference = parsedPath.__type === 'clientSdk'

  if (isClientSdkReference) {
    const { sdkId, maybeVersion } = parsedPath

    const displayName = REFERENCES[sdkId].name
    const sectionTitle =
      slug.length > 0
        ? flattenedSections.find((section) => section.slug === slug[0])?.title
        : undefined
    const url = [BASE_PATH, 'reference', sdkId, maybeVersion, slug[0]].filter(Boolean).join('/')

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
        images: generateOpenGraphImageMeta({
          type: 'API Reference',
          title: `${displayName}${sectionTitle ? `: ${sectionTitle}` : ''}`,
        }),
      },
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

interface AbbrevCommonClientLibSection {
  id: string
  type: string
  title?: string
  slug?: string
  items?: Array<AbbrevCommonClientLibSection>
  excludes?: Array<string>
  meta?: {
    shared?: boolean
  }
}

async function genClientSdkSectionTree(specFile: string, excludeName: string) {
  const spec = await getSpecCached(specFile)

  const fns = parseFnsList(spec)
  const validSections = deepFilterRec(
    commonClientLibSections as Array<AbbrevCommonClientLibSection>,
    'items',
    (section) =>
      section.type === 'markdown' || section.type === 'category'
        ? !('excludes' in section && section.excludes.includes(excludeName))
        : section.type === 'function'
          ? fns.some(({ id }) => section.id === id)
          : true
  )
  return validSections
}

async function _getSpec(specFile: string, { ext = 'yml' }: { ext?: string } = {}) {
  const specFullPath = join(SPEC_DIRECTORY, `${specFile}.${ext}`)
  const rawSpec = await readFile(specFullPath, 'utf-8')
  return ext === 'yml' ? parse(rawSpec) : rawSpec
}
const getSpecCached = cache_fullProcess_withDevCacheBust(
  _getSpec,
  SPEC_DIRECTORY,
  (filename: string) => {
    const ext = extname(filename).substring(1)
    return ext === 'yml'
      ? JSON.stringify([basename(filename)])
      : JSON.stringify([basename(filename), { ext }])
  }
)

export function flattenCommonClientLibSections(tree: Array<AbbrevCommonClientLibSection>) {
  return tree.reduce((acc, elem) => {
    if ('items' in elem) {
      const prunedElem = { ...elem }
      delete prunedElem.items
      acc.push(prunedElem)
      acc.push(...flattenCommonClientLibSections(elem.items))
    } else {
      acc.push(elem)
    }

    return acc
  }, [] as Array<AbbrevCommonClientLibSection>)
}

function parseFnsList(rawSpec: Json): Array<{ id: unknown }> {
  if (isPlainObject(rawSpec) && 'functions' in (rawSpec as object)) {
    const _rawSpec = rawSpec as { functions: unknown }
    if (Array.isArray(_rawSpec.functions)) {
      return _rawSpec.functions.filter(({ id }) => !!id)
    }
  }

  return []
}

async function _getSpecFns(specFile: string) {
  const spec = await getSpecCached(specFile)
  return parseFnsList(spec)
}
const getSpecFnsCached = cache_fullProcess_withDevCacheBust(
  _getSpecFns,
  SPEC_DIRECTORY,
  (filename: string) => {
    const ext = extname(filename).substring(1)
    return ext === 'yml'
      ? JSON.stringify([basename(filename)])
      : JSON.stringify([basename(filename), { ext }])
  }
)

function normalizeMarkdown(markdownUnescaped: string): string {
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

export { normalizeMarkdown, getSpecFnsCached, genClientSdkSectionTree }
export type { AbbrevCommonClientLibSection }
