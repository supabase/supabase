import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { CronJob } from './database-cron-job-query'
import { databaseCronJobsKeys } from './keys'

export type DatabaseCronJobsVariables = {
  projectRef?: string
  connectionString?: string
  searchTerm?: string
  skip?: number
}

export const CRON_JOBS_PAGE_SIZE = 5

const cronJobSqlQuery = (searchTerm: string = '', skip: number) => {
  return `
  with
    job_count as (
      select
        count(*) as count
      from
        cron.job
      ${searchTerm ? `where jobname like '%${searchTerm}%'` : ''}
    )
  select

    *
  from
    job_count,
    cron.job
  ${searchTerm ? `where jobname like '%${searchTerm}%'` : ''}
  order by
    jobid
  limit
    5
  offset
    50;`
}

export async function getDatabaseCronJobs({
  projectRef,
  connectionString,
  searchTerm,
  skip = 0,
}: DatabaseCronJobsVariables & { skip: number }) {
  if (!projectRef) throw new Error('Project ref is required')

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: cronJobSqlQuery(searchTerm, skip),
  })

  const count = result[0].count

  return {
    count,
    data: result.map(({ count, ...job }: any) => job),
  } as {
    count: number
    data: CronJob[]
  }
}

export type DatabaseCronJobData = { count: number; data: CronJob[] }
export type DatabaseCronJobError = ResponseError

export const useCronJobsInfiniteQuery = <TData = DatabaseCronJobData>(
  { projectRef, connectionString, searchTerm }: DatabaseCronJobsVariables,
  {
    enabled = true,
    ...options
  }: UseInfiniteQueryOptions<DatabaseCronJobData, DatabaseCronJobError, TData> = {}
) =>
  useInfiniteQuery<DatabaseCronJobData, DatabaseCronJobError, TData>(
    databaseCronJobsKeys.list(projectRef, searchTerm),
    ({ pageParam }) => {
      return getDatabaseCronJobs({
        projectRef,
        connectionString,
        searchTerm,
        skip: pageParam,
      })
    },
    {
      enabled: enabled && typeof projectRef !== 'undefined',

      getNextPageParam(lastPage, allPages) {
        const allJobs = allPages.flatMap((page) => page.data)
        const hasNextPage = lastPage.count < allJobs.length
        if (!hasNextPage) return undefined
        return allPages.length * CRON_JOBS_PAGE_SIZE
      },
      ...options,
    }
  )
