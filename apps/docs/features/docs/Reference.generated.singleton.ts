import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { SUPPORTS_NEW_REFERENCE_PROCESS } from '~/features/docs/Reference.constants'
import type { MethodTypes, VariableTypes } from '~/features/docs/Reference.typeSpec'
import type { AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import { parse } from 'yaml'

import { type Json } from '../helpers.types'
import { type IApiEndPoint } from './Reference.api.utils'

/**
 * Resolves the on-disk path for a generated SDK reference file. For libraries
 * listed in `SUPPORTS_NEW_REFERENCE_PROCESS` we read from the new
 * `content/reference/<sdk>/<version>/<name>.json` layout produced by
 * `scripts/build-reference-content.ts`; otherwise fall back to the legacy
 * `features/docs/generated/<sdk>.<version>.<name>.json` files (still used by
 * SDKs whose content hasn't migrated to the new pipeline).
 */
function generatedReferencePath(sdkId: string, version: string, name: string): string {
  if (SUPPORTS_NEW_REFERENCE_PROCESS.has(`${sdkId}-${version}`)) {
    return join(process.cwd(), 'content/reference', sdkId, version, `${name}.json`)
  }
  return join(process.cwd(), 'features/docs/generated', `${sdkId}.${version}.${name}.json`)
}

function normalizeRefPath(path: string) {
  return path.replace(/\.index(?=\.|$)/g, '').replace(/\.+/g, '.')
}

/**
 * Per-lib typeSpec cache. Each entry is the parsed
 * `content/reference/<sdk>/<version>/typeSpec.json` — a `{ methods, variables }`
 * object keyed by normalised `$ref`. `typeSpec: true` in
 * `content/navigation.references.ts` is set at the library level, so it
 * applies to every version of that library — but only versions in
 * `SUPPORTS_NEW_REFERENCE_PROCESS` actually have a typeSpec file. For
 * versions without one (legacy versions like javascript-v1), we return an
 * empty spec so the renderer simply omits signature/comment data instead of
 * crashing the build.
 */
type TypeSpecFile = {
  methods: Record<string, MethodTypes>
  variables: Record<string, VariableTypes>
}
const EMPTY_TYPESPEC: TypeSpecFile = { methods: {}, variables: {} }
const typeSpecCache = new Map<string, TypeSpecFile>()

async function loadTypeSpec(sdkId: string, version: string): Promise<TypeSpecFile> {
  const key = `${sdkId}.${version}`
  const cached = typeSpecCache.get(key)
  if (cached) return cached

  try {
    const rawJson = await readFile(generatedReferencePath(sdkId, version, 'typeSpec'), 'utf-8')
    const parsed = JSON.parse(rawJson) as TypeSpecFile
    typeSpecCache.set(key, parsed)
    return parsed
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      typeSpecCache.set(key, EMPTY_TYPESPEC)
      return EMPTY_TYPESPEC
    }
    throw err
  }
}

export async function getTypeSpec(sdkId: string, version: string, ref: string) {
  const spec = await loadTypeSpec(sdkId, version)
  const normalizedRef = normalizeRefPath(ref)
  return spec.methods[normalizedRef] ?? spec.variables[normalizedRef]
}

let cliSpec: Json

export async function getCliSpec() {
  if (!cliSpec) {
    const rawSpec = await readFile(join(process.cwd(), 'spec', 'cli_v1_commands.yaml'), 'utf-8')
    cliSpec = parse(rawSpec)
  }

  return cliSpec
}

let apiEndpointsById: Map<string, IApiEndPoint>

export async function getApiEndpointById(id: string) {
  if (!apiEndpointsById) {
    const rawJson = await readFile(
      join(process.cwd(), 'features/docs', './generated/api.latest.endpointsById.json'),
      'utf-8'
    )
    apiEndpointsById = new Map(JSON.parse(rawJson))
  }

  return apiEndpointsById.get(id)
}

let selfHostedEndpointsById = new Map<string, Map<string, IApiEndPoint>>()

export async function getSelfHostedApiEndpointById(servicePath: string, id: string) {
  if (!selfHostedEndpointsById.has(servicePath)) {
    const rawJson = await readFile(
      join(process.cwd(), 'features/docs', `./generated/${servicePath}.latest.endpointsById.json`),
      'utf-8'
    )
    selfHostedEndpointsById.set(servicePath, new Map(JSON.parse(rawJson)))
  }

  return selfHostedEndpointsById.get(servicePath)?.get(id)
}

const functionsList = new Map<string, Array<{ id: unknown }>>()

export async function getFunctionsList(sdkId: string, version: string) {
  const key = `${sdkId}.${version}`
  if (!functionsList.has(key)) {
    const data = await readFile(generatedReferencePath(sdkId, version, 'functions'), 'utf-8')
    functionsList.set(key, JSON.parse(data))
  }

  return functionsList.get(key)
}

const referenceSections = new Map<string, Array<AbbrevApiReferenceSection>>()

export async function getReferenceSections(sdkId: string, version: string) {
  const key = `${sdkId}.${version}`
  if (!referenceSections.has(key)) {
    const data = await readFile(generatedReferencePath(sdkId, version, 'sections'), 'utf-8')
    referenceSections.set(key, JSON.parse(data))
  }

  const result = referenceSections.get(key)
  return result
}

const flatSections = new Map<string, Array<AbbrevApiReferenceSection>>()

export async function getFlattenedSections(sdkId: string, version: string) {
  const key = `${sdkId}.${version}`
  if (!flatSections.has(key)) {
    const data = await readFile(generatedReferencePath(sdkId, version, 'flat'), 'utf-8')
    flatSections.set(key, JSON.parse(data))
  }

  const result = flatSections.get(key)
  return result
}

const sectionsBySlug = new Map<string, Map<string, AbbrevApiReferenceSection>>()

export async function getSectionsBySlug(sdkId: string, version: string) {
  const key = `${sdkId}.${version}`
  if (!sectionsBySlug.has(key)) {
    const data = await readFile(generatedReferencePath(sdkId, version, 'bySlug'), 'utf-8')
    const asObject = JSON.parse(data)
    sectionsBySlug.set(key, new Map(Object.entries(asObject)))
  }

  return sectionsBySlug.get(key)
}
