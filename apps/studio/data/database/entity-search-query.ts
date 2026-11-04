import { getSearchEntitiesSql } from '@supabase/pg-meta'
import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { databaseKeys } from './keys'
import { unguarded } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'

export type EntitySearchVariables = {
  projectRef?: string
  connectionString?: string | null
  query: string
}

const entitySearchResultSchema = z.object({
  tables: z.array(
    z.object({
      id: z.number(),
      schema: z.string(),
      name: z.string(),
      rls_enabled: z.boolean(),
      policy_count: z.number(),
    })
  ),
  policies: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      command: z.enum(['ALL', 'SELECT', 'INSERT', 'UPDATE', 'DELETE']),
      schema: z.string(),
      table: z.string(),
      table_id: z.number(),
    })
  ),
  triggers: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      activation: z.enum(['BEFORE', 'AFTER', 'INSTEAD OF']),
      events: z.array(z.enum(['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'])),
      schema: z.string(),
      table: z.string(),
      table_id: z.number(),
      matched_function: z.string().nullable(),
    })
  ),
  functions: z.array(
    z.object({
      id: z.number(),
      schema: z.string(),
      name: z.string(),
      type: z.enum(['function', 'procedure']),
      args: z.string(),
    })
  ),
})

async function getEntitySearch(
  { projectRef, connectionString, query }: EntitySearchVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: getSearchEntitiesSql({ query }),
      queryKey: ['entity-search'],
      grant: unguarded.migrating,
    },
    signal
  )

  return entitySearchResultSchema.parse(result[0])
}

export type EntitySearchData = Awaited<ReturnType<typeof getEntitySearch>>
export type EntitySearchTable = EntitySearchData['tables'][number]
export type EntitySearchPolicy = EntitySearchData['policies'][number]
export type EntitySearchTrigger = EntitySearchData['triggers'][number]
export type EntitySearchFunction = EntitySearchData['functions'][number]
export type EntitySearchError = StudioError

export const entitySearchQueryOptions = (
  { projectRef, connectionString, query }: EntitySearchVariables,
  { enabled = true }: { enabled?: boolean } = {}
) =>
  queryOptions({
    queryKey: databaseKeys.entitySearch(projectRef, query),
    queryFn: ({ signal }) => getEntitySearch({ projectRef, connectionString, query }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && query.length > 0,
    // Results are keyed per search string; reuse them briefly so backspacing or
    // retyping a query doesn't hit the database again.
    staleTime: 30 * 1000,
    // Keep showing the previous results while the next search is in flight,
    // but never carry them over from another project.
    placeholderData: (previousData, previousQuery) =>
      previousQuery?.queryKey[1] === projectRef ? previousData : undefined,
    // A failed search isn't worth retrying against the user's database; the
    // next keystroke issues a fresh one anyway.
    retry: false,
  })
