import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronjobsKeys } from './keys'

export type DatabaseCronjobsVariables = {
  projectRef?: string
  connectionString?: string
}

export type Cronjob = {
  jobid: number
  schedule: string
  command: string
  nodename: string
  nodeport: number
  database: string
  username: string
  active: boolean
  jobname: string
}

const cronJobSqlQuery = `select * from cron.job;`

export async function getDatabaseCronjobs({
  projectRef,
  connectionString,
}: DatabaseCronjobsVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: cronJobSqlQuery,
  })
  return result
}

export type DatabaseCronjobData = Cronjob[]
export type DatabaseCronjobError = ResponseError

export const useCronjobsQuery = <TData = DatabaseCronjobData>(
  { projectRef, connectionString }: DatabaseCronjobsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseCronjobData, DatabaseCronjobError, TData> = {}
) =>
  useQuery<DatabaseCronjobData, DatabaseCronjobError, TData>(
    databaseCronjobsKeys.list(projectRef),
    () => getDatabaseCronjobs({ projectRef, connectionString }),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
