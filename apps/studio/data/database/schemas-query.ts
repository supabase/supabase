import { QueryClient, UseQueryOptions } from '@tanstack/react-query'
import pgMeta from '@supabase/pg-meta'
import { z } from 'zod'

import { databaseKeys } from './keys'
import { ExecuteSqlData, useExecuteSqlQuery } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'

export type SchemasVariables = {
  projectRef?: string
  connectionString?: string
}

export type Schema = z.infer<typeof pgMeta.schemas.zod>

const pgMetaSchemasList = pgMeta.schemas.list()

export type SchemasData = z.infer<typeof pgMetaSchemasList.zod>
export type SchemasError = unknown

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
  return client.invalidateQueries(databaseKeys.schemaList(projectRef))
}
