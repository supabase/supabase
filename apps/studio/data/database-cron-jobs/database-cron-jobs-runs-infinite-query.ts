import { UseInfiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'
import { last } from 'lodash'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronJobsKeys } from './keys'

export type DatabaseCronJobRunsVariables = {
  projectRef?: string
  connectionString?: string | null
  jobId: number
}

export type CronJobRun = {
  jobid: number
  runid: number
  job_pid: number
  database: string
  username: string
  command: string
  // statuses https://github.com/citusdata/pg_cron/blob/f5d111117ddc0f4d83a1bad34d61b857681b6720/include/job_metadata.h#L20
  status: 'starting' | 'running' | 'sending' | 'connecting' | 'succeeded' | 'failed'
  return_message: string
  start_time: string
  end_time: string
}

export const CRON_JOB_RUNS_PAGE_SIZE = 30

export async function getDatabaseCronJobRuns({
  projectRef,
  connectionString,
  jobId,
  afterTimestamp,
}: DatabaseCronJobRunsVariables & { afterTimestamp: string }) {
  if (!projectRef) throw new Error('Project ref is required')

  let query = `
    SELECT * FROM cron.job_run_details
    WHERE
      jobid = '${jobId}'
      ${afterTimestamp ? `AND start_time < '${afterTimestamp}'` : ''}
    ORDER BY start_time DESC
    LIMIT ${CRON_JOB_RUNS_PAGE_SIZE}`

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: query,
  })
  return result
}

type DatabaseCronJobRunData = CronJobRun[]
type DatabaseCronJobError = ResponseError

export const useCronJobRunsInfiniteQuery = <TData = DatabaseCronJobRunData>(
  { projectRef, connectionString, jobId }: DatabaseCronJobRunsVariables,
  {
    enabled = true,
    ...options
  }: UseInfiniteQueryOptions<DatabaseCronJobRunData, DatabaseCronJobError, TData> = {}
) =>
  useInfiniteQuery<DatabaseCronJobRunData, DatabaseCronJobError, TData>(
    databaseCronJobsKeys.runsInfinite(projectRef, jobId, { status }),
    ({ pageParam }) => {
      return getDatabaseCronJobRuns({
        projectRef,
        connectionString,
        jobId,
        afterTimestamp: pageParam,
      })
    },
    {
      staleTime: 0,
      enabled: enabled && typeof projectRef !== 'undefined',

      getNextPageParam(lastPage) {
        const hasNextPage = lastPage.length <= CRON_JOB_RUNS_PAGE_SIZE
        if (!hasNextPage) return undefined
        return last(lastPage)?.start_time
      },
      ...options,
    }
  )
