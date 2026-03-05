import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import { last } from 'lodash'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomInfiniteQueryOptions } from 'types'
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
  return_message: string | null
  start_time: string
  end_time: string | null
}

export const CRON_JOB_RUNS_PAGE_SIZE = 30

export async function getDatabaseCronJobRuns({
  projectRef,
  connectionString,
  jobId,
  afterRunId,
}: DatabaseCronJobRunsVariables & { afterRunId: number | undefined }) {
  if (!projectRef) throw new Error('Project ref is required')

  // Use runid for ordering and pagination since it's the primary key (indexed)
  // and preserves chronological order (auto-incrementing)
  let query = `
    SELECT * FROM cron.job_run_details
    WHERE
      jobid = '${jobId}'
      ${typeof afterRunId === 'number' ? `AND runid < '${afterRunId}'` : ''}
    ORDER BY runid DESC
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
  }: UseCustomInfiniteQueryOptions<
    DatabaseCronJobRunData,
    DatabaseCronJobError,
    InfiniteData<TData>,
    readonly unknown[],
    number | undefined
  > = {}
) =>
  useInfiniteQuery({
    queryKey: databaseCronJobsKeys.runsInfinite(projectRef, jobId),
    queryFn: ({ pageParam }) => {
      return getDatabaseCronJobRuns({
        projectRef,
        connectionString,
        jobId,
        afterRunId: pageParam,
      })
    },
    staleTime: 0,
    enabled: enabled && typeof projectRef !== 'undefined',
    initialPageParam: undefined,
    getNextPageParam(lastPage) {
      if (lastPage.length < CRON_JOB_RUNS_PAGE_SIZE) return undefined
      return last(lastPage)?.runid
    },
    ...options,
  })
