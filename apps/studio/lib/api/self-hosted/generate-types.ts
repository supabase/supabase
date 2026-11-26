import { DEFAULT_EXPOSED_SCHEMAS } from './constants'
import { assertSelfHosted } from './util'
import { fetchGet } from '@/data/fetchers'
import { PG_META_URL } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'

export type GenerateTypescriptTypesOptions = {
  headers?: HeadersInit
  /** Schemas to generate types for. Omitted means the schemas exposed via PostgREST. */
  schemas?: string[]
}

type GenerateTypescriptTypesResult = {
  types: string
}

/**
 * Generates TypeScript types for the self-hosted Postgres instance via pg-meta service.
 *
 * _Only call this from server-side self-hosted code._
 */
export async function generateTypescriptTypes({
  headers,
  schemas,
}: GenerateTypescriptTypesOptions): Promise<GenerateTypescriptTypesResult | StudioError> {
  assertSelfHosted()

  // pg-meta splits `included_schemas` on commas, so a name with a comma would select other schemas.
  const invalidSchema = schemas?.find((schema) => schema.includes(','))
  if (invalidSchema !== undefined) {
    throw new Error(`Schema names cannot contain a comma: "${invalidSchema}"`)
  }

  // Default to the schemas actually exposed via PostgREST (PGRST_DB_SCHEMAS) so generated
  // types match the Data API surface, instead of a hardcoded include/exclude list.
  // Note the param is `included_schemas` (plural) — pg-meta treats a non-empty list
  // as a strict allowlist; the singular spelling is silently ignored (includes all).
  const includedSchemas = schemas ? encodeURIComponent(schemas.join(',')) : DEFAULT_EXPOSED_SCHEMAS
  const response = await fetchGet<GenerateTypescriptTypesResult>(
    `${PG_META_URL}/generators/typescript?included_schemas=${includedSchemas}`,
    { headers }
  )

  return response
}
