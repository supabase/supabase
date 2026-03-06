import { queryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'

import { privilegeKeys } from './keys'
import { getExposedTableCountsSql } from './privileges.sql'

export type ExposedTableCountsVariables = {
  projectRef?: string
  connectionString?: string | null
  selectedSchemas: string[]
}

export type ExposedTableCountsResponse = {
  total_count: number
  grants_count: number
}

export async function getExposedTableCounts(
  { projectRef, connectionString, selectedSchemas }: ExposedTableCountsVariables,
  signal?: AbortSignal
): Promise<ExposedTableCountsResponse> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!selectedSchemas) throw new Error('selectedSchemas is required')

  const sql = getExposedTableCountsSql({ selectedSchemas })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['exposed-table-counts', selectedSchemas],
    },
    signal
  )

  return result[0] as ExposedTableCountsResponse
}

export type ExposedTableCountsData = Awaited<ReturnType<typeof getExposedTableCounts>>
export type ExposedTableCountsError = ResponseError

export const exposedTableCountsQueryOptions = (
  { projectRef, connectionString, selectedSchemas }: ExposedTableCountsVariables,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return queryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- connection string doesn't change the result of the query
    queryKey: privilegeKeys.exposedTableCounts(projectRef, selectedSchemas),
    queryFn: ({ signal }) =>
      getExposedTableCounts(
        {
          projectRef,
          connectionString,
          selectedSchemas,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
  })
}
