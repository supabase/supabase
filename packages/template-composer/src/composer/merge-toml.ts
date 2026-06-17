import { parse, stringify } from 'smol-toml'

import type { MergeStrategy } from './types'

export const mergeToml: MergeStrategy = ({ files }) => {
  const warnings: string[] = []
  let merged: Record<string, unknown> = {}

  for (const file of files) {
    try {
      const parsed = parse(file.content) as Record<string, unknown>
      merged = deepMerge(merged, parsed)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      warnings.push(`Could not parse TOML from template ${file.templateId}: ${message}`)
    }
  }

  return {
    content: stringify(merged).trim(),
    warnings,
  }
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...target }

  for (const [key, value] of Object.entries(source)) {
    const existing = result[key]

    if (isPlainObject(value) && isPlainObject(existing)) {
      result[key] = deepMerge(existing, value)
    } else {
      result[key] = value
    }
  }

  return result
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}
