import { UseQueryOptions } from '@tanstack/react-query'
import { useCallback } from 'react'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'

type GetViewDefinition = {
  schema?: string
  name?: string
}

export const getViewDefinitionQuery = ({ schema, name }: GetViewDefinition) => {
  const fullName = [schema, name].filter(Boolean).join('.')

  const sql = /* SQL */ `
    select pg_get_viewdef('${fullName}', true) as definition
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
  { projectRef, connectionString, schema, name }: ViewDefinitionVariables,
  options: UseQueryOptions<ExecuteSqlData, ViewDefinitionError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getViewDefinitionQuery({ schema, name }),
      queryKey: ['view-definition', schema, name],
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
    ({ projectRef, connectionString, schema, name }: ViewDefinitionVariables) =>
      prefetch({
        projectRef,
        connectionString,
        sql: getViewDefinitionQuery({ schema, name }),
        queryKey: ['view-definition', schema, name],
      }),
    [prefetch]
  )
}
