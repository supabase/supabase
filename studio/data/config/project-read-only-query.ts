import { UseQueryOptions } from '@tanstack/react-query'
import { useCallback } from 'react'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'

// TODO: temporary solution to check if project is in read only mode
// until we get an api endpoint for this

export const getProjectReadOnlySql = () => {
  const sql = /* SQL */ `
    show default_transaction_read_only;
  `

  return sql
}

export type ProjectReadOnlyVariables = {
  projectRef?: string
  connectionString?: string
}

export type ProjectReadOnlyData = boolean
export type ProjectReadOnlyError = unknown

export const useProjectReadOnlyQuery = (
  { projectRef, connectionString }: ProjectReadOnlyVariables,
  options: Omit<
    UseQueryOptions<ExecuteSqlData, ProjectReadOnlyError, ProjectReadOnlyData>,
    'select'
  > = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getProjectReadOnlySql(),
      queryKey: ['project-read-only'],
    },
    {
      select(data) {
        return data.result[0]?.default_transaction_read_only === 'on'
      },
      enabled: typeof projectRef !== 'undefined' && typeof connectionString !== 'undefined',
      retry: (failureCount) => {
        return failureCount < 3
      },
      ...options,
    }
  )
