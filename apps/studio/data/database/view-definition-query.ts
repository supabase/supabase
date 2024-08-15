import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'

type GetViewDefinition = {
  schema?: string
  name?: string
}

export const getViewDefinitionQuery = ({ schema, name }: GetViewDefinition) => {
  const sql = /* SQL */ `
    select pg_get_viewdef(to_regclass('"${schema}"."${name}"'), true) as definition
  `.trim()

  return sql
}

export type ViewDefinitionVariables = GetViewDefinition & {
  projectRef?: string
  connectionString?: string
}

export type ViewDefinitionData = string
export type ViewDefinitionError = ExecuteSqlError

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
      enabled: typeof schema !== 'undefined' && typeof name !== 'undefined',
      ...options,
    }
  )
}
