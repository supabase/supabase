import { UseQueryOptions } from '@tanstack/react-query'
import { useCallback } from 'react'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'

type GetViewDefinition = {
  name?: string
}

type ViewDefinition = {
  id: number
  constraint_name: string
  deletion_action: string
  source_id: string
  source_schema: string
  source_table: string
  source_columns: string
  target_id: string
  target_schema: string
  target_table: string
  target_columns: string
}

export const getViewDefinitionQuery = ({ name }: GetViewDefinition) => {
  const sql = /* SQL */ `
    select pg_get_viewdef('${name}', true) as definition
  `.trim()

  return sql
}

export type ViewDefinitionVariables = GetViewDefinition & {
  projectRef?: string
  connectionString?: string
}

export type ViewDefinitionData = string
export type ViewDefinitionError = unknown

export const useViewDefinitionQuery = <TData extends ViewDefinitionData = ViewDefinitionData>(
  { projectRef, connectionString, name }: ViewDefinitionVariables,
  options: UseQueryOptions<ExecuteSqlData, ViewDefinitionError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getViewDefinitionQuery({ name }),
      queryKey: ['view-definition', name],
    },
    {
      select(data) {
        return data.result[0].definition.trim()
      },
      ...options,
    }
  )
}

export const useViewDefinitionQueryPrefetch = () => {
  const prefetch = useExecuteSqlPrefetch()

  return useCallback(
    ({ projectRef, connectionString, name }: ViewDefinitionVariables) =>
      prefetch({
        projectRef,
        connectionString,
        sql: getViewDefinitionQuery({ name }),
        queryKey: ['view-definition', name],
      }),
    [prefetch]
  )
}
