import pgMeta from '@supabase/pg-meta'
import { QueryClient, UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from 'data/sql/execute-sql-query'
import { sqlKeys } from 'data/sql/keys'

export type DatabaseRolesVariables = {
  projectRef?: string
  connectionString?: string
}

export type PgRole = z.infer<typeof pgMeta.roles.zod>

const pgMetaRolesList = pgMeta.roles.list()

export type DatabaseRolesData = z.infer<typeof pgMetaRolesList.zod>
export type DatabaseRolesError = ExecuteSqlError

export const useDatabaseRolesQuery = <TData = DatabaseRolesData>(
  { projectRef, connectionString }: DatabaseRolesVariables,
  options: UseQueryOptions<ExecuteSqlData, DatabaseRolesError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: pgMetaRolesList.sql,
      queryKey: ['roles', 'list'],
    },
    {
      select(data) {
        return data.result
      },
      ...options,
    }
  )

export function invalidateRolesQuery(client: QueryClient, projectRef: string | undefined) {
  return client.invalidateQueries(sqlKeys.query(projectRef, ['roles', 'list']))
}
