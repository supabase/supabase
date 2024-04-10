import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type GetInvolvedIndexesFromSelectQueryVariables = {
  projectRef?: string
  connectionString?: string
  query: string
}

export type GetInvolvedIndexesFromSelectQueryResponse = {
  name: string
  schema: string
  table: string
}

export async function getInvolvedIndexesInSelectQuery({
  projectRef,
  connectionString,
  query,
}: GetInvolvedIndexesFromSelectQueryVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  try {
    const { result } = await executeSql({
      projectRef,
      connectionString,
      sql: `explain (format json, analyze) ${query};`,
    })

    const plans = result[0]['QUERY PLAN']?.[0]?.['Plan']?.['Plans'] ?? []
    const involvedIndexes = plans
      .filter((plan: any) => 'Index Name' in plan)
      .map((plan: any) => `'${plan['Index Name']}'`)

    if (involvedIndexes.length === 0) return []

    const { result: indexResult } = await executeSql({
      projectRef,
      connectionString,
      sql: `select schemaname as schema, tablename as table, indexname as name from pg_indexes where indexname in (${involvedIndexes.join(', ')});`,
    })
    return indexResult as GetInvolvedIndexesFromSelectQueryResponse[]
  } catch (err) {
    return []
  }
}

export type GetInvolvedIndexesFromSelectQueryData = Awaited<
  ReturnType<typeof getInvolvedIndexesInSelectQuery>
>
export type GetInvolvedIndexesFromSelectQueryError = ResponseError

export const useGetIndexesFromSelectQuery = <TData = GetInvolvedIndexesFromSelectQueryData>(
  { projectRef, connectionString, query }: GetInvolvedIndexesFromSelectQueryVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<
    GetInvolvedIndexesFromSelectQueryData,
    GetInvolvedIndexesFromSelectQueryError,
    TData
  > = {}
) =>
  useQuery<GetInvolvedIndexesFromSelectQueryData, GetInvolvedIndexesFromSelectQueryError, TData>(
    databaseKeys.indexesFromQuery(projectRef, query),
    () => getInvolvedIndexesInSelectQuery({ projectRef, connectionString, query }),
    {
      retry: false,
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof query !== 'undefined' &&
        (query.startsWith('select') || query.startsWith('SELECT')),
      ...options,
    }
  )
