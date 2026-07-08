import { DEFAULT_EXPOSED_SCHEMAS } from './constants'
import { assertSelfHosted } from './util'
import { fetchGet } from '@/data/fetchers'
import { PG_META_URL } from '@/lib/constants'
import type { ResponseError } from '@/types'

export type GenerateTypescriptTypesOptions = {
  headers?: HeadersInit
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
}: GenerateTypescriptTypesOptions): Promise<GenerateTypescriptTypesResult | ResponseError> {
  assertSelfHosted()

  // Use the schemas actually exposed via PostgREST (PGRST_DB_SCHEMAS) so generated
  // types match the Data API surface, instead of a hardcoded include/exclude list.
  // Note the param is `included_schemas` (plural) — pg-meta treats a non-empty list
  // as a strict allowlist; the singular spelling is silently ignored (includes all).
  const response = await fetchGet<GenerateTypescriptTypesResult>(
    `${PG_META_URL}/generators/typescript?included_schemas=${DEFAULT_EXPOSED_SCHEMAS}`,
    { headers }
  )

  return response
}
