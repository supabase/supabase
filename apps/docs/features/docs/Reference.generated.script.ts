import { isPlainObject, keyBy } from 'lodash-es'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import slugify from 'slugify'
import { parse } from 'yaml'

import { clientSdkIds, REFERENCES } from '~/content/navigation.references'
import { parseTypeSpec } from '~/features/docs/Reference.typeSpec'
import type { AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import { deepFilterRec } from '~/features/helpers.fn'
import type { Json } from '~/features/helpers.types'
import authSpec from '~/spec/auth_v1_openapi.json' with { type: 'json' }
import apiCommonSections from '~/spec/common-api-sections.json' with { type: 'json' }
import cliCommonSections from '~/spec/common-cli-sections.json' with { type: 'json' }
import commonClientLibSections from '~/spec/common-client-libs-sections.json' with { type: 'json' }
import selfHostingAnalyticsCommonSections from '~/spec/common-self-hosting-analytics-sections.json' with { type: 'json' }
import selfHostingAuthCommonSections from '~/spec/common-self-hosting-auth-sections.json'
import selfHostingFunctionsCommonSections from '~/spec/common-self-hosting-functions-sections.json' with { type: 'json' }
import selfHostingRealtimeCommonSections from '~/spec/common-self-hosting-realtime-sections.json' with { type: 'json' }
import selfHostingStorageCommonSections from '~/spec/common-self-hosting-storage-sections.json' with { type: 'json' }
import storageSpec from '~/spec/storage_v0_openapi.json' with { type: 'json' }
import analyticsSpec from '~/spec/transforms/analytics_v0_openapi_deparsed.json' with { type: 'json' }
import openApiSpec from '~/spec/transforms/api_v1_openapi_deparsed.json' with { type: 'json' }
import { IApiEndPoint } from './Reference.api.utils'

const DOCS_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), '../..')
const SPEC_DIRECTORY = join(DOCS_DIRECTORY, 'spec')
const GENERATED_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), 'generated')

const selfHostingSpecs = [
  {
    id: 'self-hosting-analytics',
    sections: selfHostingAnalyticsCommonSections,
    spec: analyticsSpec,
  },
  {
    id: 'self-hosting-auth',
    sections: selfHostingAuthCommonSections,
    spec: authSpec,
  },
  {
    id: 'self-hosting-functions',
    sections: selfHostingFunctionsCommonSections,
  },
  {
    id: 'self-hosting-realtime',
    sections: selfHostingRealtimeCommonSections,
  },
  {
    id: 'self-hosting-storage',
    sections: selfHostingStorageCommonSections,
    spec: storageSpec,
  },
]

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

function mapEndpointsById(
  spec: any,
  getId = (details: any) => details.operationId
): Map<string, IApiEndPoint> {
  const endpoints = spec.paths
  const endpointsById = new Map<string, IApiEndPoint>()

  Object.entries(endpoints as Record<string, any>).forEach(([path, methods]) => {
    Object.entries(methods as Record<string, any>).forEach(([method, details]) => {
      endpointsById.set(getId(details), {
        id: getId(details),
        path,
        method: method as 'get' | 'post' | 'put' | 'delete' | 'patch',
        ...details,
      })
    })
  })

  return endpointsById
}

function genClientSdkSectionTree(
  fns: Array<{ id: unknown }>,
  excludeName: string
): AbbrevApiReferenceSection[] {
  const validSections = deepFilterRec(
    commonClientLibSections as AbbrevApiReferenceSection[],
    'items',
    (section) =>
      section.type === 'markdown' || section.type === 'category'
        ? !('excludes' in section && section.excludes?.includes(excludeName))
        : section.type === 'function'
          ? fns.some(({ id }) => section.id === id)
          : true
  )
  return validSections
}

async function genCliSectionTree(): Promise<AbbrevApiReferenceSection[]> {
  const cliSpec = await getSpec('cli_v1_commands', { ext: 'yaml' })

  const validSections = deepFilterRec(
    cliCommonSections as AbbrevApiReferenceSection[],
    'items',
    (section) =>
      section.type === 'cli-command' ? cliSpec.commands.some(({ id }) => id === section.id) : true
  )
  return validSections
}

function genApiSectionTree(endpointsById: Map<string, IApiEndPoint>): AbbrevApiReferenceSection[] {
  const validSections = deepFilterRec(
    apiCommonSections as AbbrevApiReferenceSection[],
    'items',
    (section) => (section.type === 'operation' ? endpointsById.has(section.id) : true)
  )
  return validSections
}

function genSelfHostedSectionTree(
  spec: Array<AbbrevApiReferenceSection>,
  endpointsById: Map<string, IApiEndPoint>
) {
  const validSections = deepFilterRec(spec as any, 'items', (section: any) =>
    section.type === 'self-hosted-operation' ? endpointsById.has(section.id) : true
  )
  return validSections
}

export function flattenCommonClientLibSections(tree: Array<AbbrevApiReferenceSection>) {
  return tree.reduce((acc, elem) => {
    if ('items' in elem) {
      const prunedElem = { ...elem }
      delete prunedElem.items
      acc.push(prunedElem)
      acc.push(...flattenCommonClientLibSections(elem.items || []))
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
      if (key === 'methods' || key === 'variables') {
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

async function writeSelfHostingReferenceSections() {
  let id = 0

  return Promise.all(
    selfHostingSpecs.flatMap((service) => {
      let tasks: Promise<any>[] = []

      let endpointsById: Map<string, IApiEndPoint> = new Map()
      if (service.spec) {
        endpointsById = mapEndpointsById(service.spec, (details) =>
          slugify(details.summary || `dummy-id-${String(id++)}`, {
            lower: true,
            remove: /[^\w\s-]/g,
          })
        )
        tasks.push(
          writeFile(
            join(GENERATED_DIRECTORY, `${service.id}.latest.endpointsById.json`),
            JSON.stringify(Array.from(endpointsById.entries()))
          )
        )
      }

      const selfHostedSectionTree = genSelfHostedSectionTree(service.sections, endpointsById)
      tasks.push(
        writeFile(
          join(GENERATED_DIRECTORY, `${service.id}.latest.sections.json`),
          JSON.stringify(selfHostedSectionTree)
        )
      )

      const flattenedSelfHostedSections = flattenCommonClientLibSections(
        selfHostedSectionTree as AbbrevApiReferenceSection[]
      )
      tasks.push(
        writeFile(
          join(GENERATED_DIRECTORY, `${service.id}.latest.flat.json`),
          JSON.stringify(flattenedSelfHostedSections)
        )
      )

      const selfHostedSectionsBySlug = keyBy(
        flattenedSelfHostedSections.filter(({ slug }) => !!slug),
        (section) => section.slug
      )
      tasks.push(
        writeFile(
          join(GENERATED_DIRECTORY, `${service.id}.latest.bySlug.json`),
          JSON.stringify(selfHostedSectionsBySlug)
        )
      )

      return tasks
    })
  )
}

async function run() {
  try {
    await mkdir(GENERATED_DIRECTORY, { recursive: true })

    await Promise.all([
      writeTypes(),
      writeSdkReferenceSections(),
      writeCliReferenceSections(),
      writeApiReferenceSections(),
      writeSelfHostingReferenceSections(),
    ])
  } catch (err) {
    console.error(err)
  }
}

run()
