import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'

export type DatabaseCronJobsVariables = {
  projectRef?: string
  connectionString?: string
}

export async function getDatabaseCronTimezone({
  projectRef,
  connectionString,
}: DatabaseCronJobsVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `select setting from pg_settings where name = 'cron.timezone';`,
  })
  return result[0].setting
}

export type DatabaseCronJobError = ResponseError

export const useCronTimezoneQuery = <TData = string>(
  { projectRef, connectionString }: DatabaseCronJobsVariables,
  { enabled = true, ...options }: UseQueryOptions<string, DatabaseCronJobError, TData> = {}
) =>
  useQuery<string, DatabaseCronJobError, TData>(
    databaseCronJobsKeys.timezone(projectRef),
    () => getDatabaseCronTimezone({ projectRef, connectionString }),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
