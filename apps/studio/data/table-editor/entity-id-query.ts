import { literal, safeSql } from '@supabase/pg-meta'
import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { tableEditorKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { GrantFor } from '@/lib/grants'

type EntityIdVariables = {
  projectRef?: string
  connectionString?: string | null
  schema?: string
  name?: string
  grant?: GrantFor<'post', '/platform/pg-meta/{ref}/query'>
}

const entityIdSchema = z.array(z.object({ id: z.number() }))

/** The id of a table, view, or other relation by its schema and name; null if there's none. */
async function getEntityId(
  { projectRef, connectionString, schema, name, grant }: EntityIdVariables,
  signal?: AbortSignal
) {
  if (!schema || !name) throw new Error('schema and name are required')
  if (!grant) throw new Error('grant is required')

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: safeSql`select c.oid::int as id from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = ${literal(schema)} and c.relname = ${literal(name)}`,
      queryKey: ['entity-id', schema, name],
      grant,
    },
    signal
  )
  return entityIdSchema.parse(result)[0]?.id ?? null
}

export const entityIdQueryOptions = ({
  projectRef,
  connectionString,
  schema,
  name,
  grant,
}: EntityIdVariables) =>
  queryOptions({
    queryKey: tableEditorKeys.entityId(projectRef, schema, name),
    queryFn: ({ signal }) =>
      getEntityId({ projectRef, connectionString, schema, name, grant }, signal),
    enabled: !!projectRef && !!schema && !!name && !!grant,
    staleTime: 5 * 60 * 1000,
  })
