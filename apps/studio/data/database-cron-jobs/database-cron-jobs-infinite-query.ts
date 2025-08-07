import { UseInfiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
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
WITH latest_runs AS (
  SELECT 
    jobid,
    status,
    MAX(start_time) AS latest_run
  FROM cron.job_run_details
  GROUP BY jobid, status
), most_recent_runs AS (
  SELECT 
    jobid, 
    status, 
    latest_run
  FROM latest_runs lr1
  WHERE latest_run = (
    SELECT MAX(latest_run) 
    FROM latest_runs lr2 
    WHERE lr2.jobid = lr1.jobid
  )
)
SELECT 
  job.jobid,
  job.jobname,
  job.schedule,
  job.command,
  job.active,
  mr.latest_run,
  mr.status
FROM 
  cron.job job
LEFT JOIN most_recent_runs mr ON job.jobid = mr.jobid
ORDER BY job.jobid
${!!searchTerm ? `WHERE job.jobname ILIKE '%${searchTerm}%'` : ''}
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
  }: UseInfiniteQueryOptions<
    DatabaseCronJobsInfiniteData,
    DatabaseCronJobsInfiniteError,
    TData
  > = {}
) =>
  useInfiniteQuery<DatabaseCronJobsInfiniteData, DatabaseCronJobsInfiniteError, TData>(
    databaseCronJobsKeys.listInfinite(projectRef, searchTerm),
    ({ pageParam }) => {
      return getDatabaseCronJobs({
        projectRef,
        connectionString,
        searchTerm,
        page: pageParam,
      })
    },
    {
      staleTime: 0,
      enabled: enabled && typeof projectRef !== 'undefined',
      getNextPageParam(lastPage, pages) {
        const page = pages.length
        const hasNextPage = lastPage.length >= CRON_JOBS_PAGE_LIMIT
        if (!hasNextPage) return undefined
        return page
      },
      ...options,
    }
  )
