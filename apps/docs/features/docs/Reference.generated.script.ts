import { keyBy, isPlainObject } from 'lodash'
import { dirname, join } from 'node:path'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

import { REFERENCES, clientSdkIds } from '~/content/navigation.references'
import { __parseTypeSpec } from '~/features/docs/Reference.typeSpec'
import type { AbbrevCommonClientLibSection } from '~/features/docs/Reference.utils'
import { deepFilterRec } from '~/features/helpers.fn'
import type { Json } from '~/features/helpers.types'
import commonClientLibSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }

const DOCS_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), '../..')
const SPEC_DIRECTORY = join(DOCS_DIRECTORY, 'spec')
const GENERATED_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), 'generated')

async function getSpec(specFile: string, { ext = 'yml' }: { ext?: string } = {}) {
  const specFullPath = join(SPEC_DIRECTORY, `${specFile}.${ext}`)
  const rawSpec = await readFile(specFullPath, 'utf-8')
  return ext === 'yml' ? parse(rawSpec) : rawSpec
}

async function parseFnsList(rawSpec: Json): Promise<Array<{ id: unknown }>> {
  if (isPlainObject(rawSpec) && 'functions' in (rawSpec as object)) {
    const _rawSpec = rawSpec as { functions: unknown }
    if (Array.isArray(_rawSpec.functions)) {
      return _rawSpec.functions.filter(({ id }) => !!id)
    }
  }

  return []
}

function genClientSdkSectionTree(fns: Array<{ id: unknown }>, excludeName: string) {
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

async function writeTypes() {
  const types = await __parseTypeSpec()

  await writeFile(
    join(GENERATED_DIRECTORY, 'typeSpec.json'),
    JSON.stringify(types, (key, value) => {
      if (key === 'methods') {
        return Object.fromEntries(value.entries())
      } else {
        return value
      }
    })
  )
}

async function writeReferenceSections() {
  return Promise.all(
    clientSdkIds
      .flatMap((sdkId) => {
        const versions = REFERENCES[sdkId].versions
        return versions.map((version) => ({
          sdkId,
          version,
        }))
      })
      .flatMap(async ({ sdkId, version }) => {
        const spec = await getSpec(REFERENCES[sdkId].meta[version].specFile)

        const fnsList = await parseFnsList(spec)
        const pendingFnListWrite = writeFile(
          join(GENERATED_DIRECTORY, `${sdkId}.${version}.functions.json`),
          JSON.stringify(fnsList)
        )

        const sectionTree = genClientSdkSectionTree(fnsList, REFERENCES[sdkId].meta[version].libId)
        const pendingSectionTreeWrite = writeFile(
          join(GENERATED_DIRECTORY, `${sdkId}.${version}.sections.json`),
          JSON.stringify(sectionTree)
        )

        const flattened = flattenCommonClientLibSections(sectionTree)
        const pendingFlattenedWrite = writeFile(
          join(GENERATED_DIRECTORY, `${sdkId}.${version}.flat.json`),
          JSON.stringify(flattened)
        )

        const sectionsBySlug = keyBy(flattened, (section) => section.slug)
        const pendingSlugDictionaryWrite = writeFile(
          join(GENERATED_DIRECTORY, `${sdkId}.${version}.bySlug.json`),
          JSON.stringify(sectionsBySlug)
        )

        return [
          pendingFnListWrite,
          pendingSectionTreeWrite,
          pendingFlattenedWrite,
          pendingSlugDictionaryWrite,
        ]
      })
  )
}

async function run() {
  try {
    await mkdir(GENERATED_DIRECTORY, { recursive: true })

    await Promise.all([writeTypes(), writeReferenceSections()])
  } catch (err) {
    console.error(err)
  }
}

run()
