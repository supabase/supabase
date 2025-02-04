import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { CronJobRun } from './database-cron-jobs-runs-infinite-query'
import { databaseCronJobsKeys } from './keys'

export type DatabaseCronJobRunVariables = {
  projectRef?: string
  connectionString?: string
  jobId: number
}

export async function getDatabaseCronJobRun({
  projectRef,
  connectionString,
  jobId,
}: DatabaseCronJobRunVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const query = `
    SELECT * FROM cron.job_run_details
    WHERE jobid = '${jobId}'
    ORDER BY start_time DESC
    LIMIT 1`

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: query,
  })

  return result[0] ?? null
}

export type DatabaseCronJobRunData = CronJobRun | null
export type DatabaseCronJobRunError = ResponseError

export const useCronJobRunQuery = <TData = DatabaseCronJobRunData>(
  { projectRef, connectionString, jobId }: DatabaseCronJobRunVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseCronJobRunData, DatabaseCronJobRunError, TData> = {}
) =>
  useQuery<DatabaseCronJobRunData, DatabaseCronJobRunError, TData>(
    databaseCronJobsKeys.run(projectRef, jobId),
    () => getDatabaseCronJobRun({ projectRef, connectionString, jobId }),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
