import { ident, joinSqlFragments, literal, safeSql } from '@supabase/pg-meta'
import { queryOptions, type QueryClient } from '@tanstack/react-query'
import { z } from 'zod'

import { executeSql } from './execute-sql-mutation'
import { sqlKeys } from './keys'
import { parsedQueryQueryOptions } from './parsed-query-query'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import type { GrantFor } from '@/lib/grants'

export type QueryRelationsVariables = {
  projectRef?: string
  connectionString?: string | null
  sql?: string
  grant?: GrantFor<'post', '/platform/pg-meta/{ref}/query'>
}

const queryRelationSchema = z.object({
  id: z.number(),
  schema: z.string(),
  name: z.string(),
  type: z.nativeEnum(ENTITY_TYPE),
})

/** A relation as the catalog knows it — the same shape Explorer opens a table or view from. */
export type QueryRelation = z.infer<typeof queryRelationSchema>

/**
 * The database relations a query reads or writes, resolved against the catalog the way
 * Postgres resolves them when the query runs — so an unqualified name lands on whatever the
 * search path finds. Names that don't resolve (dropped tables, typos) and system catalogs
 * are left out.
 */
async function getQueryRelations(
  { projectRef, connectionString, sql, grant }: QueryRelationsVariables,
  client: QueryClient,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sql) throw new Error('sql is required')
  if (!grant) throw new Error('grant is required')

  const parsed = await client.fetchQuery(parsedQueryQueryOptions({ sql }))
  const references = parsed?.relations ?? []
  if (references.length === 0) return []

  const names = references.map(({ schema, name }) =>
    literal(schema ? `${ident(schema)}.${ident(name)}` : ident(name))
  )

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: safeSql`
        select distinct on (c.oid) c.oid::int as id, n.nspname as schema, c.relname as name, c.relkind as type, r.position::int as position
        from unnest(array[${joinSqlFragments(names, ', ')}]::text[]) with ordinality as r(name, position)
        join pg_catalog.pg_class c on c.oid = pg_catalog.to_regclass(r.name)
        join pg_catalog.pg_namespace n on n.oid = c.relnamespace
        where c.relkind in ('r', 'p', 'v', 'm', 'f')
          and n.nspname <> 'information_schema'
          and n.nspname !~ '^pg_'
        order by c.oid, r.position
      `,
      queryKey: ['query-relations'],
      grant,
    },
    signal
  )

  return z
    .array(queryRelationSchema.extend({ position: z.number() }))
    .parse(result)
    .sort((a, b) => a.position - b.position)
    .map(({ position: _position, ...relation }) => relation)
}

export type QueryRelationsData = Awaited<ReturnType<typeof getQueryRelations>>

export const queryRelationsQueryOptions = ({
  projectRef,
  connectionString,
  sql,
  grant,
}: QueryRelationsVariables) =>
  queryOptions({
    queryKey: sqlKeys.relations(projectRef, sql),
    queryFn: ({ client, signal }) =>
      getQueryRelations({ projectRef, connectionString, sql, grant }, client, signal),
    enabled: !!projectRef && !!sql && !!grant,
    retry: false,
    staleTime: 60 * 1000,
  })
