import { fetchGet } from 'data/fetchers'
import { PG_META_URL } from 'lib/constants'
import { assertSelfHosted } from './util'
import { ResponseError } from 'types'

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
    `${PG_META_URL}/generators/typescript?included_schema=${includedSchema}&excluded_schemas=${excludedSchema}`,
    { headers }
  )

  return response
}
