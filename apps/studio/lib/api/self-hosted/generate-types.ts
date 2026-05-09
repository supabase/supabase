import { getPgMetaUrlByRef } from './projects'
import { assertSelfHosted } from './util'
import { fetchGet } from '@/data/fetchers'
import type { ResponseError } from '@/types'

export type GenerateTypescriptTypesOptions = {
  headers?: HeadersInit
  /** Project ref — defaults to `'default'` for backward compatibility. */
  ref?: string
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
  ref = 'default',
}: GenerateTypescriptTypesOptions): Promise<GenerateTypescriptTypesResult | ResponseError> {
  assertSelfHosted()

  const pgMetaUrl = getPgMetaUrlByRef(ref)
  const includedSchema = ['public', 'graphql_public', 'storage'].join(',')

  const excludedSchema = [
    'auth',
    'cron',
    'extensions',
    'graphql',
    'net',
    'pgsodium',
    'pgsodium_masks',
    'realtime',
    'supabase_functions',
    'supabase_migrations',
    'vault',
    '_analytics',
    '_realtime',
  ].join(',')

  const response = await fetchGet<GenerateTypescriptTypesResult>(
    `${pgMetaUrl}/generators/typescript?included_schema=${includedSchema}&excluded_schemas=${excludedSchema}`,
    { headers }
  )

  return response
}
