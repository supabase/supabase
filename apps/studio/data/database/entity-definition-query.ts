import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'
import { databaseKeys } from './keys'
import { SupportedAssistantEntities } from 'components/ui/AIAssistantPanel/AIAssistant.types'

export const getEntityDefinitionQuery = ({
  id,
  type,
}: {
  id?: number
  type?: SupportedAssistantEntities | null
}) => {
  if (!id || !type) return ''

  if (type === 'functions') {
    return /* SQL */ `
      select pg_get_functiondef(${id})
    `.trim()
  } else if (type === 'rls-policies') {
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

// type EntityDefinition = { id: number; sql: string }
export type EntityDefinitionData = string
export type EntityDefinitionError = ExecuteSqlError

export const useEntityDefinitionQuery = <TData extends EntityDefinitionData = EntityDefinitionData>(
  { id, type, projectRef, connectionString }: EntityDefinitionVariables,
  { enabled = true, ...options }: UseQueryOptions<ExecuteSqlData, EntityDefinitionError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getEntityDefinitionQuery({ id, type }),
      queryKey: databaseKeys.entityDefinition(projectRef, id),
    },
    {
      select(data) {
        return data.result[0].pg_get_functiondef
      },
      ...options,
    }
  )
}
