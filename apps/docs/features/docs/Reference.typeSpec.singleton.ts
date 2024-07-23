import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { ModuleTypes } from '~/features/docs/Reference.typeSpec'

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
