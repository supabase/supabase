import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'
import { CronJob } from './database-cron-jobs-query'

export type DatabaseCronJobRunsVariables = {
  projectRef?: string
  connectionString?: string
  jobId: number
}

export async function getDatabaseCronJobRuns({
  projectRef,
  connectionString,
  jobId,
}: DatabaseCronJobRunsVariables) {
  const cronJobRunsQuery = `select * from cron.job_run_details where jobid = '${jobId}' order by start_time desc limit 10`
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: cronJobRunsQuery,
  })
  return result
}

export type DatabaseCronJobData = CronJob[]
export type DatabaseCronJobError = ResponseError

export const useCronJobRunsQuery = <TData = DatabaseCronJobData>(
  { projectRef, connectionString, jobId }: DatabaseCronJobRunsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseCronJobData, DatabaseCronJobError, TData> = {}
) =>
  useQuery<DatabaseCronJobData, DatabaseCronJobError, TData>(
    databaseCronJobsKeys.runs(projectRef, jobId),
    () => getDatabaseCronJobRuns({ projectRef, connectionString, jobId }),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
