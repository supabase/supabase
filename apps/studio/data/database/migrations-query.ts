import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'

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
export type MigrationsError = ExecuteSqlError

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
      handleError: (error) => {
        if (
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
