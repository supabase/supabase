import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parse } from 'yaml'

import type { ModuleTypes } from '~/features/docs/Reference.typeSpec'
import type { AbbrevApiReferenceSection } from '~/features/docs/Reference.utils'
import { type Json } from '../helpers.types'
import { type IApiEndPoint } from './Reference.api.utils'

let typeSpec: Array<ModuleTypes>

async function _typeSpecSingleton() {
  if (!typeSpec) {
    const rawJson = await readFile(
      join(process.cwd(), 'features/docs', './generated/typeSpec.json'),
      'utf-8'
    )
    typeSpec = JSON.parse(rawJson, (key, value) => {
      if (key === 'methods' || key === 'variables') {
        return new Map(Object.entries(value))
      } else {
        return value
      }
    })
  }

  return typeSpec
}

function normalizeRefPath(path: string) {
  return path.replace(/\.index(?=\.|$)/g, '').replace(/\.+/g, '.')
}

export async function getTypeSpec(ref: string) {
  const modules = await _typeSpecSingleton()

  const normalizedRef = normalizeRefPath(ref)
  const delimiter = normalizedRef.indexOf('.')
  const refMod = normalizedRef.substring(0, delimiter)

  const mod = modules.find((mod) => mod.name === refMod)
  // Check methods first, then variables
  return mod?.methods.get(normalizedRef) ?? mod?.variables.get(normalizedRef)
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
    const data = await readFile(
      join(process.cwd(), 'features/docs', `./generated/${sdkId}.${version}.functions.json`),
      'utf-8'
    )

    functionsList.set(key, JSON.parse(data))
  }

  return functionsList.get(key)
}

const referenceSections = new Map<string, Array<AbbrevApiReferenceSection>>()

export async function getReferenceSections(sdkId: string, version: string) {
  const key = `${sdkId}.${version}`
  if (!referenceSections.has(key)) {
    const data = await readFile(
      join(process.cwd(), 'features/docs', `./generated/${sdkId}.${version}.sections.json`),
      'utf-8'
    )

    referenceSections.set(key, JSON.parse(data))
  }

  const result = referenceSections.get(key)
  return result
}

const flatSections = new Map<string, Array<AbbrevApiReferenceSection>>()

export async function getFlattenedSections(sdkId: string, version: string) {
  const key = `${sdkId}.${version}`
  if (!flatSections.has(key)) {
    const data = await readFile(
      join(process.cwd(), 'features/docs', `./generated/${sdkId}.${version}.flat.json`),
      'utf-8'
    )

    flatSections.set(key, JSON.parse(data))
  }

  const result = flatSections.get(key)
  return result
}

const sectionsBySlug = new Map<string, Map<string, AbbrevApiReferenceSection>>()

export async function getSectionsBySlug(sdkId: string, version: string) {
  const key = `${sdkId}.${version}`
  if (!sectionsBySlug.has(key)) {
    const data = await readFile(
      join(process.cwd(), 'features/docs', `./generated/${sdkId}.${version}.bySlug.json`),
      'utf-8'
    )
    const asObject = JSON.parse(data)

    sectionsBySlug.set(key, new Map(Object.entries(asObject)))
  }

  return sectionsBySlug.get(key)
}
