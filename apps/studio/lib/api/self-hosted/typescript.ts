import { fetchGet } from 'data/fetchers'
import { PG_META_URL } from 'lib/constants'
import { WrappedResult } from './types'
import { assertSelfHosted } from './util'

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
}: GenerateTypescriptTypesOptions): Promise<WrappedResult<GenerateTypescriptTypesResult>> {
  assertSelfHosted()

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

  const response = await fetchGet(
    `${PG_META_URL}/generators/typescript?included_schema=${includedSchema}&excluded_schemas=${excludedSchema}`,
    { headers }
  )

  if (response.error) {
    return { data: undefined, error: response.error }
  } else {
    return { data: response, error: undefined }
  }
}
