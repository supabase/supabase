import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'

const PAGE_LIMIT = 20

export type DatabaseCronJobsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export type CronJob = {
  jobid: number
  jobname: string | null
  active: boolean
  command: string
  latest_run: string
  schedule: string
  status: string
}

const cronJobSqlQueryV2 = `
WITH latest_runs AS (
  SELECT 
    jobid,
    status,
    MAX(start_time) AS latest_run
  FROM cron.job_run_details
  GROUP BY jobid, status
)
SELECT 
  job.jobid,
  job.jobname,
  job.schedule,
  job.command,
  job.active,
  lr.latest_run,
  lr.status
FROM 
  cron.job job
LEFT JOIN latest_runs lr ON job.jobid = lr.jobid
ORDER BY job.jobid;
`.trim()

export async function getDatabaseCronJobs({
  projectRef,
  connectionString,
}: DatabaseCronJobsVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: cronJobSqlQueryV2,
    queryKey: ['cron-jobs'],
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
