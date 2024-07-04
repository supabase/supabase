import { isPlainObject } from 'lodash'
import { readFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { parse } from 'yaml'

import { cache_fullProcess_withDevCacheBust } from '~/features/helpers.fs'
import { SPEC_DIRECTORY } from '~/lib/docs'
import commonClientLibSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }
import type { Json } from '~/types'

async function genClientSdkNav(libPath: string, specFile: string) {
  const rawSpec = await getSpec(specFile)
  const spec = parse(rawSpec) as Json

  const fns = parseFnsList(spec)
  return commonClientLibSections
}

async function _getSpec(specFile: string, { ext = 'yml' }: { ext?: string } = {}) {
  const specFullPath = join(SPEC_DIRECTORY, `${specFile}.${ext}`)
  const rawSpec = await readFile(specFullPath, 'utf-8')
  return rawSpec
}
const getSpec = cache_fullProcess_withDevCacheBust(_getSpec, SPEC_DIRECTORY, (filename: string) => {
  const ext = extname(filename).substring(1)
  return ext === 'yml'
    ? JSON.stringify([basename(filename)])
    : JSON.stringify([basename(filename), { ext }])
})

function parseFnsList(rawSpec: Json): Array<{ id: unknown }> {
  if (isPlainObject(rawSpec) && 'functions' in (rawSpec as object)) {
    const _rawSpec = rawSpec as { functions: unknown }
    if (Array.isArray(_rawSpec.functions)) {
      return _rawSpec.functions.filter(({ id }) => !!id)
    }
  }

  return []
}

interface ClientSdkNavigationProps {
  libPath: string
  specFile: string
}

async function ClientSdkNavigation({ libPath, specFile }: ClientSdkNavigationProps) {
  const navSections = await genClientSdkNav(libPath, specFile)

  return (
    <>
      <pre>{JSON.stringify(navSections, null, 2)}</pre>
    </>
  )
}

export { ClientSdkNavigation }
