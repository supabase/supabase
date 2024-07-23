import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { ModuleTypes } from '~/features/docs/Reference.typeSpec'
import type { AbbrevCommonClientLibSection } from '~/features/docs/Reference.utils'

let typeSpec: Array<ModuleTypes>

async function _typeSpecSingleton() {
  if (!typeSpec) {
    const rawJson = await readFile(
      join(dirname(fileURLToPath(import.meta.url)), './generated/typeSpec.json'),
      'utf-8'
    )
    typeSpec = JSON.parse(rawJson, (key, value) => {
      if (key === 'methods') {
        return new Map(Object.entries(value))
      } else {
        return value
      }
    })
  }

  return typeSpec
}

export async function getTypeSpec(ref: string) {
  const modules = await _typeSpecSingleton()

  const delimiter = ref.indexOf('.')
  const refMod = ref.substring(0, delimiter)

  const mod = modules.find((mod) => mod.name === refMod)
  return mod?.methods.get(ref)
}

const functionsList = new Map<string, Array<{ id: unknown }>>()

export async function getFunctionsList(sdkId: string, version: string) {
  const key = `${sdkId}.${version}`
  if (!functionsList.has(key)) {
    const data = await readFile(
      join(
        dirname(fileURLToPath(import.meta.url)),
        `./generated/${sdkId}.${version}.functions.json`
      ),
      'utf-8'
    )

    functionsList.set(key, JSON.parse(data))
  }

  return functionsList.get(key)
}

const referenceSections = new Map<string, Array<AbbrevCommonClientLibSection>>()

export async function getReferenceSections(sdkId: string, version: string) {
  const key = `${sdkId}.${version}`
  if (!referenceSections.has(key)) {
    const data = await readFile(
      join(
        dirname(fileURLToPath(import.meta.url)),
        `./generated/${sdkId}.${version}.sections.json`
      ),
      'utf-8'
    )

    referenceSections.set(key, JSON.parse(data))
  }

  return referenceSections.get(key)
}

const flatSections = new Map<string, Array<AbbrevCommonClientLibSection>>()

export async function getFlattenedSections(sdkId: string, version: string) {
  const key = `${sdkId}.${version}`
  if (!flatSections.has(key)) {
    const data = await readFile(
      join(dirname(fileURLToPath(import.meta.url)), `./generated/${sdkId}.${version}.flat.json`),
      'utf-8'
    )

    flatSections.set(key, JSON.parse(data))
  }

  return flatSections.get(key)
}

const sectionsBySlug = new Map<string, Map<string, AbbrevCommonClientLibSection>>()

export async function getSectionsBySlug(sdkId: string, version: string) {
  const key = `${sdkId}.${version}`
  if (!sectionsBySlug.has(key)) {
    const data = await readFile(
      join(dirname(fileURLToPath(import.meta.url)), `./generated/${sdkId}.${version}.bySlug.json`),
      'utf-8'
    )
    const asObject = JSON.parse(data)

    sectionsBySlug.set(key, new Map(Object.entries(asObject)))
  }

  return sectionsBySlug.get(key)
}
