import { useCallback } from 'react'
import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'

export type DatabaseMigration = {
  version: string
  name?: string
  statements?: string[]
}

export const getMigrationsQuery = () => {
  const sql = /* SQL */ `
    select
      *
    from supabase_migrations.schema_migrations sm
    order by sm.version desc
  `.trim()

  return sql
}

export type MigrationsVariables = {
  projectRef?: string
  connectionString?: string
}

export type MigrationsData = { result: DatabaseMigration[] }
export type MigrationsError = unknown

export const useMigrationsQuery = <TData extends MigrationsData = MigrationsData>(
  { projectRef, connectionString }: MigrationsVariables,
  options: UseQueryOptions<ExecuteSqlData, MigrationsError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getMigrationsQuery(),
      queryKey: ['migrations'],
      handleError: (error: { code: number; message: string; requestId: string }) => {
        if (
          error.code === 400 &&
          error.message.includes('relation "supabase_migrations.schema_migrations" does not exist')
        ) {
          return { result: [] }
        } else {
          throw error
        }
      },
    },
    options
  )
}

export const useMigrationsPrefetch = () => {
  const prefetch = useExecuteSqlPrefetch()

  return useCallback(
    ({ projectRef, connectionString }: MigrationsVariables) =>
      prefetch({
        projectRef,
        connectionString,
        sql: getMigrationsQuery(),
        queryKey: ['migrations'],
      }),
    [prefetch]
  )
}
