import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'

export type DatabaseCronJobsVariables = {
  projectRef?: string
  connectionString?: string
}

export type CronJob = {
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

const cronJobSqlQuery = `select * from cron.job order by jobid;`

export async function getDatabaseCronJobs({
  projectRef,
  connectionString,
}: DatabaseCronJobsVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: cronJobSqlQuery,
  })
  return result
}

export type DatabaseCronJobData = CronJob[]
export type DatabaseCronJobError = ResponseError

export const useCronJobsQuery = <TData = DatabaseCronJobData>(
  { projectRef, connectionString }: DatabaseCronJobsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseCronJobData, DatabaseCronJobError, TData> = {}
) =>
  useQuery<DatabaseCronJobData, DatabaseCronJobError, TData>(
    databaseCronJobsKeys.list(projectRef),
    () => getDatabaseCronJobs({ projectRef, connectionString }),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
