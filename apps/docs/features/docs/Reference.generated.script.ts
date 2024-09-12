import { keyBy, isPlainObject } from 'lodash'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'

import { REFERENCES, clientSdkIds } from '~/content/navigation.references'
import { parseTypeSpec } from '~/features/docs/Reference.typeSpec'
import type { AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import { deepFilterRec } from '~/features/helpers.fn'
import type { Json } from '~/features/helpers.types'
import apiCommonSections from '~/spec/common-api-sections.json' assert { type: 'json' }
import cliCommonSections from '~/spec/common-cli-sections.json' assert { type: 'json' }
import commonClientLibSections from '~/spec/common-client-libs-sections.json' assert { type: 'json' }
import openApiSpec from '~/spec/transforms/api_v1_openapi_deparsed.json' assert { type: 'json' }
import { IApiEndPoint } from './Reference.api.utils'

const DOCS_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), '../..')
const SPEC_DIRECTORY = join(DOCS_DIRECTORY, 'spec')
const GENERATED_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), 'generated')

async function getSpec(specFile: string, { ext = 'yml' }: { ext?: string } = {}) {
  const specFullPath = join(SPEC_DIRECTORY, `${specFile}.${ext}`)
  const rawSpec = await readFile(specFullPath, 'utf-8')
  return ext === 'yml' || ext === 'yaml' ? parse(rawSpec) : rawSpec
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

function mapEndpointsById(spec: typeof openApiSpec): Map<string, IApiEndPoint> {
  const endpoints = spec.paths
  const endpointsById = new Map<string, IApiEndPoint>()

  Object.entries(endpoints).forEach(([path, methods]) => {
    Object.entries(methods).forEach(([method, details]) => {
      endpointsById.set(details.operationId, {
        id: details.operationId,
        path,
        method,
        ...details,
      })
    })
  })

  return endpointsById
}

function genClientSdkSectionTree(fns: Array<{ id: unknown }>, excludeName: string) {
  const validSections = deepFilterRec(
    commonClientLibSections as Array<AbbrevApiReferenceSection>,
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

async function genCliSectionTree() {
  const cliSpec = await getSpec('cli_v1_commands', { ext: 'yaml' })

  const validSections = deepFilterRec(
    cliCommonSections as Array<AbbrevApiReferenceSection>,
    'items',
    (section) =>
      section.type === 'cli-command' ? cliSpec.commands.some(({ id }) => id === section.id) : true
  )
  return validSections
}

function genApiSectionTree(endpointsById: Map<string, IApiEndPoint>) {
  const validSections = deepFilterRec(
    apiCommonSections as Array<AbbrevApiReferenceSection>,
    'items',
    (section) => (section.type === 'operation' ? endpointsById.has(section.id) : true)
  )
  return validSections
}

export function flattenCommonClientLibSections(tree: Array<AbbrevApiReferenceSection>) {
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
  }, [] as Array<AbbrevApiReferenceSection>)
}

async function writeTypes() {
  const types = await parseTypeSpec()

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

async function writeSdkReferenceSections() {
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

        const sdkSectionTree = genClientSdkSectionTree(
          fnsList,
          REFERENCES[sdkId].meta[version].libId
        )
        const pendingSdkSectionTreeWrite = writeFile(
          join(GENERATED_DIRECTORY, `${sdkId}.${version}.sections.json`),
          JSON.stringify(sdkSectionTree)
        )

        const flattenedSdkSections = flattenCommonClientLibSections(sdkSectionTree)
        const pendingFlattenedSdkSectionsWrite = writeFile(
          join(GENERATED_DIRECTORY, `${sdkId}.${version}.flat.json`),
          JSON.stringify(flattenedSdkSections)
        )

        const sdkSectionsBySlug = keyBy(flattenedSdkSections, (section) => section.slug)
        const pendingSdkSlugDictionaryWrite = writeFile(
          join(GENERATED_DIRECTORY, `${sdkId}.${version}.bySlug.json`),
          JSON.stringify(sdkSectionsBySlug)
        )

        return [
          pendingFnListWrite,
          pendingSdkSectionTreeWrite,
          pendingFlattenedSdkSectionsWrite,
          pendingSdkSlugDictionaryWrite,
        ]
      })
  )
}

async function writeCliReferenceSections() {
  const cliSectionTree = await genCliSectionTree()
  const pendingCliSectionTreeWrite = writeFile(
    join(GENERATED_DIRECTORY, 'cli.latest.sections.json'),
    JSON.stringify(cliSectionTree)
  )

  const flattenedCliSections = flattenCommonClientLibSections(cliSectionTree)
  const pendingFlattenedCliSectionsWrite = writeFile(
    join(GENERATED_DIRECTORY, 'cli.latest.flat.json'),
    JSON.stringify(flattenedCliSections)
  )

  const cliSectionsBySlug = keyBy(
    flattenedCliSections.filter(({ slug }) => !!slug),
    (section) => section.slug
  )
  const pendingCliSlugDictionaryWrite = writeFile(
    join(GENERATED_DIRECTORY, 'cli.latest.bySlug.json'),
    JSON.stringify(cliSectionsBySlug)
  )

  return Promise.all([
    pendingCliSectionTreeWrite,
    pendingFlattenedCliSectionsWrite,
    pendingCliSlugDictionaryWrite,
  ])
}

async function writeApiReferenceSections() {
  const endpointsById = mapEndpointsById(openApiSpec)
  const pendingEndpointsByIdWrite = writeFile(
    join(GENERATED_DIRECTORY, 'api.latest.endpointsById.json'),
    JSON.stringify(Array.from(endpointsById.entries()))
  )

  const apiSectionTree = genApiSectionTree(endpointsById)
  const pendingApiSectionTreeWrite = writeFile(
    join(GENERATED_DIRECTORY, 'api.latest.sections.json'),
    JSON.stringify(apiSectionTree)
  )

  const flattenedApiSections = flattenCommonClientLibSections(apiSectionTree)
  const pendingFlattenedApiSectionsWrite = writeFile(
    join(GENERATED_DIRECTORY, 'api.latest.flat.json'),
    JSON.stringify(flattenedApiSections)
  )

  const apiSectionsBySlug = keyBy(
    flattenedApiSections.filter(({ slug }) => !!slug),
    (section) => section.slug
  )
  const pendingApiSlugDictionaryWrite = writeFile(
    join(GENERATED_DIRECTORY, 'api.latest.bySlug.json'),
    JSON.stringify(apiSectionsBySlug)
  )

  return Promise.all([
    pendingEndpointsByIdWrite,
    pendingApiSectionTreeWrite,
    pendingFlattenedApiSectionsWrite,
    pendingApiSlugDictionaryWrite,
  ])
}

async function run() {
  try {
    await mkdir(GENERATED_DIRECTORY, { recursive: true })

    await Promise.all([
      writeTypes(),
      writeSdkReferenceSections(),
      writeCliReferenceSections(),
      writeApiReferenceSections(),
    ])
  } catch (err) {
    console.error(err)
  }
}

run()
