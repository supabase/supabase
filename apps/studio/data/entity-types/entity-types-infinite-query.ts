import { getEntityTypesSQL } from '@supabase/pg-meta'
import { InfiniteData, QueryClient, useInfiniteQuery } from '@tanstack/react-query'

import { ENTITY_TYPE } from './entity-type-constants'
import { entityTypeKeys } from './keys'
import { executeSql, ExecuteSqlVariables } from '@/data/sql/execute-sql-query'
import type { ResponseError, UseCustomInfiniteQueryOptions } from '@/types'

export type EntityTypesVariables = {
  projectRef?: string
  schemas?: string[]
  search?: string
  limit?: number
  page?: number
  sort?: 'alphabetical' | 'grouped-alphabetical'
  filterTypes?: string[]
} & Pick<ExecuteSqlVariables, 'connectionString'>

export interface Entity {
  id: number
  schema: string
  name: string
  type: ENTITY_TYPE
  comment: string | null
  rls_enabled: boolean
}

export type EntityTypesResponse = {
  data: {
    entities: Entity[]
    count: number
  }
}

export async function getEntityTypes(
  {
    projectRef,
    connectionString,
    schemas = ['public'],
    search,
    limit = 100,
    page = 0,
    sort = 'alphabetical',
    filterTypes = Object.values(ENTITY_TYPE),
  }: EntityTypesVariables,
  signal?: AbortSignal
) {
  const sql = getEntityTypesSQL({ schemas, sort, filterTypes, search, limit, page })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['entity-types', ...schemas, page],
    },
    signal
  )

  return result[0] as EntityTypesResponse
}

export type EntityTypesData = Awaited<ReturnType<typeof getEntityTypes>>
export type EntityTypesError = ResponseError

export const useEntityTypesQuery = <TData = EntityTypesData>(
  {
    projectRef,
    connectionString,
    schemas = ['public'],
    search,
    limit = 100,
    sort,
    filterTypes,
  }: Omit<EntityTypesVariables, 'page'>,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<
    EntityTypesData,
    EntityTypesError,
    InfiniteData<TData>,
    readonly unknown[],
    number | undefined
  > = {}
) => {
  return useInfiniteQuery({
    queryKey: entityTypeKeys.list(projectRef, { schemas, search, sort, limit, filterTypes }),
    queryFn: ({ signal, pageParam }) =>
      getEntityTypes(
        {
          projectRef,
          connectionString,
          schemas,
          search,
          limit,
          page: pageParam,
          sort,
          filterTypes,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
    initialPageParam: undefined,
    getNextPageParam(lastPage, pages) {
      const page = pages.length
      const currentTotalCount = page * limit
      const totalCount = lastPage.data.count

      if (currentTotalCount >= totalCount) {
        return undefined
      }

      return page
    },
    ...options,
  })
}

export function prefetchEntityTypes(
  client: QueryClient,
  {
    projectRef,
    connectionString,
    schemas = ['public'],
    search,
    limit = 100,
    sort,
    filterTypes,
  }: Omit<EntityTypesVariables, 'page'>
) {
  return client.prefetchInfiniteQuery({
    queryKey: entityTypeKeys.list(projectRef, { schemas, search, sort, limit, filterTypes }),
    initialPageParam: 0,
    queryFn: ({ signal, pageParam }) =>
      getEntityTypes(
        {
          projectRef,
          connectionString,
          schemas,
          search,
          limit,
          page: pageParam,
          sort,
          filterTypes,
        },
        signal
      ),
  })
}
