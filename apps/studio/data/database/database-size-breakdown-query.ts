import { safeSql } from '@supabase/pg-meta'
import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { databaseKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { ResponseError } from '@/types'

const bytesSchema = z.coerce.number().nonnegative().finite().safe()
const relationSchema = z.object({
  id: z.string(),
  name: z.string(),
  schema: z.string(),
  table_bytes: bytesSchema,
  index_bytes: bytesSchema,
  toast_bytes: bytesSchema,
  indexes: z.array(z.object({ id: z.string(), name: z.string(), bytes: bytesSchema })),
})

const snapshotSchema = z.object({
  database_name: z.string(),
  database_bytes: bytesSchema,
  instance_bytes: bytesSchema,
  relations: z.array(relationSchema),
})

export type DatabaseSizeRelation = z.infer<typeof relationSchema>
export type DatabaseSizeBreakdownData = z.infer<typeof snapshotSchema>
export type DatabaseSizeBreakdownError = ResponseError
export type DatabaseSizeBreakdownVariables = {
  projectRef?: string
  databaseIdentifier?: string
  connectionString?: string | null
}

export const databaseSizeBreakdownSql = safeSql`
  SELECT current_database() AS database_name,
    pg_database_size(current_database()) AS database_bytes,
    (SELECT sum(pg_database_size(oid)) FROM pg_database) AS instance_bytes,
    coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'id', c.oid::text, 'name', c.relname, 'schema', n.nspname,
        'table_bytes', pg_relation_size(c.oid, 'main') + pg_relation_size(c.oid, 'fsm')
          + pg_relation_size(c.oid, 'vm') + pg_relation_size(c.oid, 'init'),
        'index_bytes', pg_indexes_size(c.oid),
        'toast_bytes', CASE WHEN c.reltoastrelid = 0 THEN 0
          ELSE pg_total_relation_size(c.reltoastrelid) END,
        'indexes', coalesce((
          SELECT jsonb_agg(jsonb_build_object(
            'id', i.indexrelid::text, 'name', ic.relname,
            'bytes', pg_total_relation_size(i.indexrelid)
          ) ORDER BY i.indexrelid)
          FROM pg_index i JOIN pg_class ic ON ic.oid = i.indexrelid
          WHERE i.indrelid = c.oid
        ), '[]'::jsonb)
      ) ORDER BY c.oid)
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relkind IN ('r', 'm') AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND n.nspname !~ '^pg_toast' AND n.nspname !~ '^pg_temp'
    ), '[]'::jsonb) AS relations
`

async function getDatabaseSizeBreakdown(
  { projectRef, connectionString }: DatabaseSizeBreakdownVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')
  const { result } = await executeSql<unknown[]>(
    { projectRef, connectionString, sql: databaseSizeBreakdownSql },
    signal
  )
  return snapshotSchema.parse(result[0])
}

export const databaseSizeBreakdownQueryOptions = (variables: DatabaseSizeBreakdownVariables) =>
  queryOptions({
    queryKey: databaseKeys.sizeBreakdown(variables.projectRef, variables.databaseIdentifier),
    queryFn: ({ signal }) => getDatabaseSizeBreakdown(variables, signal),
    enabled: !!variables.projectRef,
    staleTime: 60_000,
  })
