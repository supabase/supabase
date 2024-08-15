import pgMeta from '@supabase/pg-meta'
import { QueryClient, UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'

export type SchemasVariables = {
  projectRef?: string
  connectionString?: string
}

export type Schema = z.infer<typeof pgMeta.schemas.zod>

const pgMetaSchemasList = pgMeta.schemas.list()

export type SchemasData = z.infer<typeof pgMetaSchemasList.zod>
export type SchemasError = ExecuteSqlError

export const useSchemasQuery = <TData = SchemasData>(
  { projectRef, connectionString }: SchemasVariables,
  options: UseQueryOptions<ExecuteSqlData, SchemasError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: pgMetaSchemasList.sql,
      queryKey: ['schemas', 'list'],
    },
    {
      select(data) {
        return data.result
      },
      ...options,
    }
  )

export function invalidateSchemasQuery(client: QueryClient, projectRef: string | undefined) {
  return client.invalidateQueries(sqlKeys.query(projectRef, ['schemas', 'list']))
}
