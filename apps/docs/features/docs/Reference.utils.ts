import { isPlainObject } from 'lodash'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { mdxjs } from 'micromark-extension-mdxjs'
import { readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { visit } from 'unist-util-visit'
import { parse } from 'yaml'

import { deepFilterRec } from '~/features/helpers.fn'
import type { Json } from '~/features/helpers.types'
import { cache_fullProcess_withDevCacheBust } from '~/features/helpers.fs'
import { SPEC_DIRECTORY } from '~/lib/docs'
import commonClientLibSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }

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
      section.type === 'markdown'
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
