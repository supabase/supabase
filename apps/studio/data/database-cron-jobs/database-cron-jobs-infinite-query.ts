import { useInfiniteQuery } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomInfiniteQueryOptions } from 'types'
import { databaseCronJobsKeys } from './keys'

const CRON_JOBS_PAGE_LIMIT = 20

type DatabaseCronJobRunsVariables = {
  projectRef?: string
  connectionString?: string | null
  searchTerm?: string
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

// [Joshen] Just to call out that I had AI help me with this, so please let me know if this can be optimized
const getCronJobSql = ({ searchTerm, page }: { searchTerm?: string; page: number }) =>
  `
SELECT
  job.jobid,
  job.jobname,
  job.schedule,
  job.command,
  job.active,
  latest_run.start_time as latest_run,
  latest_run.status
FROM
  cron.job
LEFT JOIN LATERAL (
  SELECT
	run.start_time,
	run.status
  FROM cron.job_run_details run
  WHERE run.jobid = job.jobid
  ORDER BY run.runid DESC
  LIMIT 1
) latest_run ON TRUE
${!!searchTerm ? `WHERE job.jobname ILIKE '%${searchTerm}%'` : ''}
ORDER BY job.jobid
LIMIT ${CRON_JOBS_PAGE_LIMIT}
OFFSET ${page * CRON_JOBS_PAGE_LIMIT};
`.trim()

export async function getDatabaseCronJobs({
  projectRef,
  connectionString,
  searchTerm,
  page = 0,
}: DatabaseCronJobRunsVariables & { page: number }) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: getCronJobSql({ searchTerm, page }),
    queryKey: ['cron-jobs'],
  })

  return result
}

type DatabaseCronJobsInfiniteData = CronJob[]
type DatabaseCronJobsInfiniteError = ResponseError

export const useCronJobsInfiniteQuery = <TData = DatabaseCronJobsInfiniteData>(
  { projectRef, connectionString, searchTerm }: DatabaseCronJobRunsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    DatabaseCronJobsInfiniteData,
    DatabaseCronJobsInfiniteError,
    TData
  > = {}
) =>
  useInfiniteQuery<DatabaseCronJobsInfiniteData, DatabaseCronJobsInfiniteError, TData>({
    queryKey: databaseCronJobsKeys.listInfinite(projectRef, searchTerm),
    queryFn: ({ pageParam }) => {
      return getDatabaseCronJobs({
        projectRef,
        connectionString,
        searchTerm,
        page: pageParam,
      })
    },
    staleTime: 0,
    enabled: enabled && typeof projectRef !== 'undefined',
    getNextPageParam(lastPage, pages) {
      const page = pages.length
      const hasNextPage = lastPage.length >= CRON_JOBS_PAGE_LIMIT
      if (!hasNextPage) return undefined
      return page
    },
    ...options,
  })
