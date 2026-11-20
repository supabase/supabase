import pgMeta, {
  getTablesPaginatedSql,
  listTablesFallback,
  listTablesPaginatedFallback,
  withCatalogFallback,
  type PGTable,
} from '@supabase/pg-meta'
import { InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { sortBy } from 'lodash'
import { useCallback } from 'react'
import { z } from 'zod'

import { tableKeys } from './keys'
import { unguarded } from '@/data/fetchers'
import { catalogFallbackQuery } from '@/data/sql/catalog-fallback-query'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { SafePostgresTable } from '@/lib/postgres-types'
import type { UseCustomInfiniteQueryOptions, UseCustomQueryOptions } from '@/types'

export type TablesVariables = {
  projectRef?: string
  connectionString?: string | null
  schema?: string
  /** Defaults to false */
  includeColumns?: boolean
  sortByProperty?: keyof PGTable
}

const pgMetaTablesList = pgMeta.tables.list()
export type TablesData = z.infer<typeof pgMetaTablesList.zod>

export async function getTables(
  {
    projectRef,
    connectionString,
    schema,
    includeColumns = false,
    sortByProperty = 'name',
  }: TablesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  const options = { includeColumns, includedSchemas: schema ? [schema] : undefined }
  const sql = pgMeta.tables.list(options).sql
  const variables = {
    projectRef,
    connectionString,
    queryName: 'tables',
    queryKey: ['tables', schema],
    grant: unguarded.migrating,
  }

  const result = await withCatalogFallback(
    async () => (await executeSql({ ...variables, sqlOrigin: 'studio', sql }, signal)).result,
    () => listTablesFallback(catalogFallbackQuery(variables, signal), options)
  )
  // Sort the data if the sortByName option is true
  if (Array.isArray(result) && sortByProperty) {
    return sortBy(result, (t) => t[sortByProperty]) as SafePostgresTable[]
  }
  return result as SafePostgresTable[]
}

export type TablesError = StudioError

export const useTablesQuery = <TData = TablesData>(
  vars: TablesVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<TablesData, TablesError, TData> = {}
) => {
  const { projectRef, schema, includeColumns } = vars
  return useQuery<TablesData, TablesError, TData>({
    queryKey: tableKeys.list(projectRef, schema, { includeColumns }),
    queryFn: ({ signal }) => getTables(vars, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
}

/**
 * useGetTables
 * Tries to get tables from the react-query cache, or loads it from the server if it's not cached.
 */
export function useGetTables({
  projectRef,
  connectionString,
}: Pick<TablesVariables, 'projectRef' | 'connectionString'>) {
  const queryClient = useQueryClient()

  return useCallback(
    (schema?: TablesVariables['schema'], includeColumns?: TablesVariables['includeColumns']) => {
      return queryClient.fetchQuery({
        queryKey: tableKeys.list(projectRef, schema, { includeColumns }),
        queryFn: ({ signal }) =>
          getTables({ projectRef, connectionString, schema, includeColumns }, signal),
      })
    },
    [connectionString, projectRef, queryClient]
  )
}

export function usePrefetchTables({
  projectRef,
  connectionString,
}: Pick<TablesVariables, 'projectRef' | 'connectionString'>) {
  const queryClient = useQueryClient()

  return useCallback(
    (schema?: TablesVariables['schema'], includeColumns?: TablesVariables['includeColumns']) => {
      return queryClient.prefetchQuery({
        queryKey: tableKeys.list(projectRef, schema, { includeColumns }),
        queryFn: ({ signal }) =>
          getTables({ projectRef, connectionString, schema, includeColumns }, signal),
      })
    },
    [connectionString, projectRef, queryClient]
  )
}

export type InfiniteTablesVariables = Pick<
  TablesVariables,
  'projectRef' | 'connectionString' | 'schema' | 'includeColumns'
> & {
  pageSize?: number
  nameFilter?: string
}

export async function getTablesPage(
  {
    projectRef,
    connectionString,
    schema,
    includeColumns = false,
    limit,
    afterOid,
    nameFilter,
  }: Pick<TablesVariables, 'projectRef' | 'connectionString' | 'schema' | 'includeColumns'> & {
    limit: number
    afterOid: number
    nameFilter?: string
  },
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const options = { schema, includeColumns, limit, afterOid, nameFilter }
  const sql = getTablesPaginatedSql(options)
  const variables = {
    projectRef,
    connectionString,
    queryName: 'tables-infinite',
    queryKey: [
      `project:${projectRef}`,
      `schema:${schema}`,
      `infinite_tables`,
      includeColumns ? 'with_columns' : null,
      nameFilter ? `search:${nameFilter}` : null,
      limit ? `page_size:${limit}` : null,
      afterOid ? `after:${afterOid}` : null,
    ],
    grant: unguarded.migrating,
  }

  const result = await withCatalogFallback(
    async () => (await executeSql({ ...variables, sqlOrigin: 'studio', sql }, signal)).result,
    () => listTablesPaginatedFallback(catalogFallbackQuery(variables, signal), options)
  )

  return result as SafePostgresTable[]
}

export const useInfiniteTablesQuery = <TData = InfiniteData<SafePostgresTable[]>>(
  {
    projectRef,
    connectionString,
    schema,
    includeColumns,
    pageSize = 50,
    nameFilter,
  }: InfiniteTablesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<TablesData, TablesError, TData, readonly unknown[], number> = {}
) => {
  return useInfiniteQuery({
    queryKey: tableKeys.infiniteList(projectRef, schema, { includeColumns, pageSize, nameFilter }),
    queryFn: ({ signal, pageParam }) =>
      getTablesPage(
        {
          projectRef,
          connectionString,
          schema,
          includeColumns,
          limit: pageSize,
          afterOid: pageParam,
          nameFilter,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.length < pageSize ? undefined : lastPage[lastPage.length - 1].id,
    ...options,
  })
}
