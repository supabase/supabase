import pgMeta from '@supabase/pg-meta'
import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { databaseKeys } from './keys'

export type SchemasVariables = {
  orgSlug?: string
  projectRef?: string
  connectionString?: string | null
}

export type Schema = z.infer<typeof pgMeta.schemas.zod>

const pgMetaSchemasList = pgMeta.schemas.list()

export type SchemasData = z.infer<typeof pgMetaSchemasList.zod>
export type SchemasError = ExecuteSqlError

export async function getSchemas(
  { orgSlug, projectRef, connectionString }: SchemasVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql(
    {
      orgSlug,
      projectRef,
      connectionString,
      sql: pgMetaSchemasList.sql,
      queryKey: ['schemas'],
    },
    signal
  )

  return result
}

export const useSchemasQuery = <TData = SchemasData>(
  { orgSlug, projectRef, connectionString }: SchemasVariables,
  { enabled = true, ...options }: UseQueryOptions<SchemasData, SchemasError, TData> = {}
) =>
  useQuery<SchemasData, SchemasError, TData>(
    databaseKeys.schemas(orgSlug, projectRef),
    ({ signal }) => getSchemas({ orgSlug, projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export function invalidateSchemasQuery(client: QueryClient, orgSlug: string | undefined, projectRef: string | undefined) {
  return client.invalidateQueries(databaseKeys.schemas(orgSlug, projectRef))
}

export function prefetchSchemas(
  client: QueryClient,
  { orgSlug, projectRef, connectionString }: SchemasVariables
) {
  return client.fetchQuery(databaseKeys.schemas(orgSlug, projectRef), ({ signal }) =>
    getSchemas({ projectRef, connectionString }, signal)
  )
}
