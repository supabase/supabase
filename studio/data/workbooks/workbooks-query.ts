import { UseQueryOptions } from '@tanstack/react-query'
import {
  ExecuteQueryData,
  useExecuteQueryPrefetch,
  useExecuteQueryQuery,
} from '../sql/execute-query-query'

export const WORKBOOKS_QUERY = /* SQL */ `
  select * from supabase_workbook.workbooks;
`

export type Workbook = {
  id: string
  created_at: string
  title: string
}

export type WorkbooksVariables = {
  projectRef?: string
  connectionString?: string
}

export type WorkbooksData = { workbooks: Workbook[] }
export type WorkbooksError = unknown

export const useWorkbooksQuery = <TData extends WorkbooksData = WorkbooksData>(
  { projectRef, connectionString }: WorkbooksVariables,
  options: UseQueryOptions<ExecuteQueryData, WorkbooksError, TData> = {}
) =>
  useExecuteQueryQuery(
    { projectRef, connectionString, sql: WORKBOOKS_QUERY },
    {
      select(data) {
        return { workbooks: data.result } as TData
      },
      enabled: typeof projectRef !== 'undefined',
      ...options,
    }
  )

export const useWorkbooksPrefetch = ({ projectRef, connectionString }: WorkbooksVariables) => {
  return useExecuteQueryPrefetch({ projectRef, connectionString, sql: WORKBOOKS_QUERY })
}
