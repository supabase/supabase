import { getEntityDefinitionsSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { databaseKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

export type EntityDefinitionsVariables = {
  limit?: number
  projectRef?: string
  connectionString?: string | null
  schemas: string[]
}

export async function getEntityDefinitions(
  { projectRef, connectionString, schemas, limit }: EntityDefinitionsVariables,
  signal?: AbortSignal
) {
  const sql = getEntityDefinitionsSql({ schemas, limit })
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['entity-definitions', schemas],
    },
    signal
  )

  return result[0].data.definitions
}

type EntityDefinition = { id: number; sql: string }
export type EntityDefinitionsData = EntityDefinition[]
export type EntityDefinitionsError = ExecuteSqlError

export const useEntityDefinitionsQuery = <TData = EntityDefinitionsData>(
  { projectRef, connectionString, schemas, limit }: EntityDefinitionsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<EntityDefinitionsData, EntityDefinitionsError, TData> = {}
) =>
  useQuery<EntityDefinitionsData, EntityDefinitionsError, TData>({
    queryKey: databaseKeys.entityDefinitions(projectRef, schemas),
    queryFn: ({ signal }) =>
      getEntityDefinitions({ projectRef, connectionString, schemas, limit }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && schemas.length > 0,
    ...options,
  })
