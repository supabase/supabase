import { toProjectConfigJsonSchema } from '@supabase/config'
import { isPlainObject } from 'lodash'
import { describe, it } from 'vitest'

import { CONFIG_FIELD_REGISTRY, getFieldDefinition } from './ConfigurationDriftPage.constants'

function getConfigFieldPaths(): string[] {
  const schema: unknown = toProjectConfigJsonSchema()
  const sections = isRecord(schema) ? schema.properties : undefined
  if (!isRecord(sections)) return []

  const configPaths: string[] = []

  function isRecord(value: unknown): value is Record<string, unknown> {
    return isPlainObject(value)
  }

  function walk(node: unknown, path: string[]) {
    const properties = isRecord(node) ? node.properties : undefined
    if (isRecord(properties) && Object.keys(properties).length > 0) {
      for (const [key, childNode] of Object.entries(properties)) walk(childNode, [...path, key])
      return
    }

    configPaths.push(path.join('.'))
  }

  for (const [section, sectionNode] of Object.entries(sections)) walk(sectionNode, [section])

  return configPaths
}

describe('getFieldDefinition', () => {
  it('has a definition for every field the default project config can report', () => {
    const missingPaths = getConfigFieldPaths().filter(
      (configPath) => !getFieldDefinition(configPath)
    )

    if (missingPaths.length > 0) {
      throw new Error(
        `CONFIG_FIELD_REGISTRY is missing a definition for:\n${missingPaths.join('\n')}`
      )
    }
  })

  // marked as fails because it depends on @supabase/config being fixed. Once it's fixed, this test should pass and
  // be kept for future regressions of the package.
  it.fails('has no definitions for fields the default project config cannot report', () => {
    const validPaths = new Set(getConfigFieldPaths())

    const extraPaths = Object.keys(CONFIG_FIELD_REGISTRY).filter(
      (configPath) => !validPaths.has(configPath)
    )

    if (extraPaths.length > 0) {
      throw new Error(
        `CONFIG_FIELD_REGISTRY has definitions for fields the default project config never reports:\n${extraPaths.join('\n')}`
      )
    }
  })
})
