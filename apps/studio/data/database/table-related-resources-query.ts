import { getTableReferencingFunctionsSql, getTableRelatedResourcesSql } from '@supabase/pg-meta'
import { queryOptions, skipToken } from '@tanstack/react-query'
import { z } from 'zod'

import { databaseKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'

export type TableRelatedResourcesGrant = GrantFor<'post', '/platform/pg-meta/{ref}/query', 'read'>

export type TableRelatedResourcesVariables = {
  projectRef?: string
  connectionString?: string | null
  schema?: string
  name?: string
  grant?: TableRelatedResourcesGrant
}

const tableRelatedResourcesSchema = z.object({
  policies: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      command: z.enum(['ALL', 'SELECT', 'INSERT', 'UPDATE', 'DELETE']),
      schema: z.string(),
    })
  ),
  triggers: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      activation: z.enum(['BEFORE', 'AFTER', 'INSTEAD OF']),
      events: z.array(z.enum(['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'])),
      schema: z.string(),
    })
  ),
  indexes: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      schema: z.string(),
      columns: z.array(z.string()),
      is_primary: z.boolean(),
      is_unique: z.boolean(),
    })
  ),
})

const tableReferencingFunctionsSchema = z.object({
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

type ResolvedVariables = Required<
  Pick<TableRelatedResourcesVariables, 'projectRef' | 'schema' | 'name' | 'grant'>
> &
  Pick<TableRelatedResourcesVariables, 'connectionString'>

async function getTableRelatedResources(
  { projectRef, connectionString, schema, name, grant }: ResolvedVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: getTableRelatedResourcesSql({ schema, name }),
      sqlOrigin: 'studio',
      queryName: 'table-related-resources',
      queryKey: ['table-related-resources'],
      grant,
    },
    signal
  )

  return tableRelatedResourcesSchema.parse(result[0])
}

async function getTableReferencingFunctions(
  { projectRef, connectionString, schema, name, grant }: ResolvedVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: getTableReferencingFunctionsSql({ schema, name }),
      sqlOrigin: 'studio',
      queryName: 'table-referencing-functions',
      queryKey: ['table-referencing-functions'],
      grant,
    },
    signal
  )

  return tableReferencingFunctionsSchema.parse(result[0])
}

export type TableRelatedResourcesData = Awaited<ReturnType<typeof getTableRelatedResources>>
export type TableReferencingFunctionsData = Awaited<ReturnType<typeof getTableReferencingFunctions>>
export type TableRelatedPolicy = TableRelatedResourcesData['policies'][number]
export type TableRelatedTrigger = TableRelatedResourcesData['triggers'][number]
export type TableRelatedIndex = TableRelatedResourcesData['indexes'][number]
export type TableRelatedFunction = TableReferencingFunctionsData['functions'][number]
export type TableRelatedResourcesError = StudioError

// A table's related resources rarely change within a session, and this runs on
// every command menu open, so reuse the last result rather than querying again.
const RELATED_STALE_TIME = 5 * 60 * 1000

/** Policies and triggers: index probes, fast enough to render on open. */
export const tableRelatedResourcesQueryOptions = (
  { projectRef, connectionString, schema, name, grant }: TableRelatedResourcesVariables,
  { enabled = true }: { enabled?: boolean } = {}
) =>
  queryOptions({
    queryKey: databaseKeys.tableRelatedResources(projectRef, schema, name),
    queryFn:
      enabled && projectRef && schema && name && grant
        ? ({ signal }: { signal: AbortSignal }) =>
            getTableRelatedResources({ projectRef, connectionString, schema, name, grant }, signal)
        : skipToken,
    staleTime: RELATED_STALE_TIME,
    // The command menu opens and closes constantly; a failed lookup isn't worth
    // retrying against the user's database.
    retry: false,
  })

/**
 * Functions mentioning the table. Kept separate from the policies and triggers
 * because it reads function bodies, which costs orders of magnitude more — this
 * way the rest of the section doesn't wait on it.
 */
export const tableReferencingFunctionsQueryOptions = (
  { projectRef, connectionString, schema, name, grant }: TableRelatedResourcesVariables,
  { enabled = true }: { enabled?: boolean } = {}
) =>
  queryOptions({
    queryKey: databaseKeys.tableReferencingFunctions(projectRef, schema, name),
    queryFn:
      enabled && projectRef && schema && name && grant
        ? ({ signal }: { signal: AbortSignal }) =>
            getTableReferencingFunctions(
              { projectRef, connectionString, schema, name, grant },
              signal
            )
        : skipToken,
    staleTime: RELATED_STALE_TIME,
    retry: false,
  })
