import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlError } from '../sql/execute-sql-query'
import { EntityDefinitionsVariables, getEntityDefinitions } from './fetchers'
import { databaseKeys } from './keys'

type EntityDefinition = { id: number; sql: string }
export type EntityDefinitionsData = EntityDefinition[]
export type EntityDefinitionsError = ExecuteSqlError

export const useEntityDefinitionsQuery = <TData = EntityDefinitionsData>(
  { projectRef, connectionString, schemas, limit }: EntityDefinitionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<EntityDefinitionsData, EntityDefinitionsError, TData> = {}
) =>
  useQuery<EntityDefinitionsData, EntityDefinitionsError, TData>(
    databaseKeys.entityDefinitions(projectRef, schemas),
    ({ signal }) => getEntityDefinitions({ projectRef, connectionString, schemas, limit }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && schemas.length > 0,
      ...options,
    }
  )
