import { UseQueryOptions } from '@tanstack/react-query'
import type { ExecuteSqlData, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { useExecuteSqlQuery } from 'data/sql/execute-sql-query'
import { ResponseError } from 'types'
import { databaseCronjobsKeys } from './keys'

export type DatabaseCronjobsVariables = {
  projectRef?: string
  connectionString?: string
}

export type Cronjob = {
  jobid: number
  schedule: string
  command: string
  nodename: string
  nodeport: number
  database: string
  username: string
  active: boolean
  jobname: string
}

const cronJobSqlQuery = `select * from cron.job;`

export type DatabaseCronjobData = Cronjob[]
export type DatabaseCronjobError = ResponseError

export const useCronjobsQuery = (
  { projectRef, connectionString }: DatabaseCronjobsVariables,
  options: UseQueryOptions<ExecuteSqlData, ExecuteSqlError, DatabaseCronjobData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: cronJobSqlQuery,
      queryKey: databaseCronjobsKeys.list(projectRef),
    },
    {
      select(data) {
        return (data as any)?.result ?? []
      },
      ...options,
    }
  )
}
