import type { SwaggerTransform } from '@fastify/swagger'
import type { KeywordDefinition, Plugin } from 'ajv'
import type { FastifyServerOptions } from 'fastify'

export const finiteKeyword: KeywordDefinition = {
  keyword: 'finite',
  schemaType: 'boolean',
  validate: (enabled: boolean, value: unknown) =>
    !enabled || value === null || (typeof value === 'number' && Number.isFinite(value)),
}

export const addFiniteKeyword: Plugin<unknown> = (ajv) => ajv.addKeyword(finiteKeyword)

// Swagger otherwise emits custom AJV keywords verbatim. Clone before stripping so documentation
// generation cannot mutate the schemas used for runtime validation.
// This assumes nested objects are schema structure: a boolean `finite` field inside `examples`,
// `default`, or `const` data would also be removed and needs a schema-key-aware walker first.
export function stripFiniteKeyword<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(stripFiniteKeyword) as T
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) {
    return value
  }

  const result: Record<string, unknown> = {}
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key === 'finite' && typeof nestedValue === 'boolean') {
      continue
    }

    result[key] = stripFiniteKeyword(nestedValue)
  }

  return result as T
}

export const finiteSwaggerTransform: SwaggerTransform = ({ schema, url }) => ({
  schema: stripFiniteKeyword(schema),
  url,
})

export function withFiniteAjv<T extends FastifyServerOptions>(options: T): T {
  return {
    ...options,
    ajv: {
      ...options.ajv,
      plugins: [...(options.ajv?.plugins ?? []), addFiniteKeyword],
    },
  }
}
