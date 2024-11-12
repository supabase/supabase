import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { SupportedAssistantEntities } from 'components/ui/AIAssistantPanel/AIAssistant.types'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'

// [Joshen] Eventually should support table definition and view definition as well if possible
export const getEntityDefinitionSql = ({
  id,
  type,
}: {
  id?: number
  type?: SupportedAssistantEntities | 'table' | 'view' | null
}) => {
  if (!id) {
    throw new Error('id is required')
  }
  if (!type) {
    throw new Error('type is required')
  }

  switch (type) {
    case 'functions':
      return /* SQL */ `
      select pg_get_functiondef(${id})
    `.trim()
    case 'rls-policies':
      // [Joshen] Eventually to-do, unless we have to piece it manually?
      return /* SQL */ `
      select 1;
    `.trim()
  }

  return ''
}

export type EntityDefinitionVariables = {
  id?: number
  type?: SupportedAssistantEntities | null
  projectRef?: string
  connectionString?: string
}

export async function getEntityDefinition(
  { projectRef, connectionString, id, type }: EntityDefinitionVariables,
  signal?: AbortSignal
) {
  if (!id) {
    throw new Error('id is required')
  }

  const sql = getEntityDefinitionSql({ id, type })
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['entity-definition', id],
    },
    signal
  )

  return result[0].pg_get_functiondef
}

// type EntityDefinition = { id: number; sql: string }
export type EntityDefinitionData = string
export type EntityDefinitionError = ExecuteSqlError

export const useEntityDefinitionQuery = <TData = EntityDefinitionData>(
  { projectRef, connectionString, id, type }: EntityDefinitionVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<EntityDefinitionData, EntityDefinitionError, TData> = {}
) =>
  useQuery<EntityDefinitionData, EntityDefinitionError, TData>(
    databaseKeys.entityDefinition(projectRef, id),
    ({ signal }) => getEntityDefinition({ projectRef, connectionString, id, type }, signal),
    {
      enabled:
        enabled &&
        typeof projectRef !== 'undefined' &&
        typeof id !== 'undefined' &&
        !isNaN(id) &&
        typeof type !== 'undefined',
      ...options,
    }
  )
