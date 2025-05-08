import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'

interface DatabaseCronJobVariables {
  projectRef?: string
  connectionString?: string
  jobName: string
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

const cronJobByNameQuery = (jobName: string) => `
  select * from cron.job 
  where jobname = '${jobName}'
  limit 1;
`

export async function getDatabaseCronJob({
  projectRef,
  connectionString,
  jobName,
}: DatabaseCronJobVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: cronJobByNameQuery(jobName),
  })
  return result[0] as CronJob | undefined
}

export type DatabaseCronJobData = CronJob | undefined
export type DatabaseCronJobError = ResponseError

export function useCronJobQuery<TData = DatabaseCronJobData>(
  { projectRef, connectionString, jobName }: DatabaseCronJobVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseCronJobData, DatabaseCronJobError, TData> = {}
) {
  return useQuery<DatabaseCronJobData, DatabaseCronJobError, TData>(
    databaseCronJobsKeys.detail(projectRef, jobName),
    () => getDatabaseCronJob({ projectRef, connectionString, jobName }),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
}
