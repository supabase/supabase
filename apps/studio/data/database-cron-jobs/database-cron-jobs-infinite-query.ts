import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import { COST_THRESHOLD_ERROR, executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomInfiniteQueryOptions } from 'types'

import { getCronJobsSql } from '../sql/queries/get-cron-jobs'
import { databaseCronJobsKeys } from './keys'

export const CRON_JOBS_PAGE_LIMIT = 20

export type DatabaseCronJobRunsVariables = {
  projectRef?: string
  connectionString?: string | null
  searchTerm?: string
}

export type CronJob = {
  jobid: number
  jobname: string | null
  active: boolean
  command: string
  schedule: string
  latest_run?: string
  status?: string
}

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
    sql: getCronJobsSql({ searchTerm, page, limit: CRON_JOBS_PAGE_LIMIT }),
    queryKey: ['cron-jobs'],
    preflightCheck: true,
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
    InfiniteData<TData>,
    readonly unknown[],
    number
  > = {}
) =>
  useInfiniteQuery({
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
    initialPageParam: 0,
    getNextPageParam(lastPage, pages) {
      const page = pages.length
      const hasNextPage = lastPage.length >= CRON_JOBS_PAGE_LIMIT
      if (!hasNextPage) return undefined
      return page
    },
    retry: (failureCount, error) => {
      if (error.message === COST_THRESHOLD_ERROR) return false
      return failureCount < 3
    },
    ...options,
  })
