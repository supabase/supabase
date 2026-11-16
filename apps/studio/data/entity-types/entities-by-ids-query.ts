import { getEntitiesByIdsSQL } from '@supabase/pg-meta'
import { queryOptions } from '@tanstack/react-query'

import type { Entity } from './entity-types-infinite-query'
import { entityTypeKeys } from './keys'
import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'

export type EntitiesByIdsVariables = {
  projectRef?: string
  connectionString?: string | null
  ids: number[]
}

async function getEntitiesByIds(
  { projectRef, connectionString, ids }: EntitiesByIdsVariables,
  signal?: AbortSignal
) {
  if (ids.length === 0) return []

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sqlOrigin: 'studio',
      queryName: 'entities-by-ids',
      sql: getEntitiesByIdsSQL({ ids }),
      queryKey: ['entities-by-ids', ...ids],
      grant: unguarded.migrating,
    },
    signal
  )

  return result as Entity[]
}

export type EntitiesByIdsData = Awaited<ReturnType<typeof getEntitiesByIds>>
export type EntitiesByIdsError = StudioError

export const entitiesByIdsQueryOptions = ({
  projectRef,
  connectionString,
  ids,
}: EntitiesByIdsVariables) =>
  queryOptions<EntitiesByIdsData, EntitiesByIdsError>({
    queryKey: entityTypeKeys.byIds(projectRef, ids),
    queryFn: ({ signal }) => getEntitiesByIds({ projectRef, connectionString, ids }, signal),
    enabled: typeof projectRef !== 'undefined' && ids.length > 0,
  })
