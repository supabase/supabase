import { InfiniteData, useInfiniteQuery } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomInfiniteQueryOptions } from 'types'

import { getCronJobsMinimalSql } from '../sql/queries/get-cron-jobs'
import {
  CRON_JOBS_PAGE_LIMIT,
  CronJob,
  DatabaseCronJobRunsVariables,
} from './database-cron-jobs-infinite-query'
import { databaseCronJobsKeys } from './keys'

export async function getDatabaseCronJobsMinimal({
  projectRef,
  connectionString,
  searchTerm,
  page = 0,
}: DatabaseCronJobRunsVariables & { page: number }) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: getCronJobsMinimalSql({ searchTerm, page, limit: CRON_JOBS_PAGE_LIMIT }),
    queryKey: ['cron-jobs-minimal'],
  })

  return result
}

type DatabaseCronJobsMinimalInfiniteData = CronJob[]
type DatabaseCronJobsMinimalInfiniteError = ResponseError

export const useCronJobsMinimalInfiniteQuery = <TData = DatabaseCronJobsMinimalInfiniteData>(
  { projectRef, connectionString, searchTerm }: DatabaseCronJobRunsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    DatabaseCronJobsMinimalInfiniteData,
    DatabaseCronJobsMinimalInfiniteError,
    InfiniteData<TData>,
    readonly unknown[],
    number
  > = {}
) =>
  useInfiniteQuery({
    queryKey: databaseCronJobsKeys.listInfiniteMinimal(projectRef, searchTerm),
    queryFn: ({ pageParam }) => {
      return getDatabaseCronJobsMinimal({
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
    ...options,
  })
