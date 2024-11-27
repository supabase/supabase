import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'

export type DatabaseCronJobRunsVariables = {
  projectRef?: string
  connectionString?: string
  jobId: number
}

export type CronJobRun = {
  jobid: number
  runid: number
  job_pid: number
  database: string
  username: string
  command: string
  status: string
  return_message: string
  start_time: string
  end_time: string
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

export type DatabaseCronJobData = CronJobRun[]
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
