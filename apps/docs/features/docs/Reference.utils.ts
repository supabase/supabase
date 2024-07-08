import { isPlainObject } from 'lodash'
import { readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
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

function parseFnsList(rawSpec: Json): Array<{ id: unknown }> {
  if (isPlainObject(rawSpec) && 'functions' in (rawSpec as object)) {
    const _rawSpec = rawSpec as { functions: unknown }
    if (Array.isArray(_rawSpec.functions)) {
      return _rawSpec.functions.filter(({ id }) => !!id)
    }
  }

  return []
}

async function _getSpecFns(specFile: string, opts: Parameters<typeof getSpecCached>[1] = {}) {
  const spec = await getSpecCached(specFile, opts)
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

export { getSpecFnsCached, genClientSdkSectionTree }
export type { AbbrevCommonClientLibSection }
