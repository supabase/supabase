import { ident, literal, safeSql } from '@supabase/pg-meta'
import { Query } from '@supabase/pg-meta/src/query'
import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { executeSql } from './execute-sql-mutation'
import { sqlKeys } from './keys'
import { constructHeaders, fetchHandler, handleError } from '@/data/fetchers'
import { getTable } from '@/data/tables/table-retrieve-query'
import { BASE_PATH } from '@/lib/constants'
import { editableQuerySchema, getResultColumnMapping } from '@/lib/query-result-editing'
import { wrapWithRoleImpersonation, type RoleImpersonationState } from '@/lib/role-impersonation'
import { isRoleImpersonationEnabled } from '@/state/role-impersonation-state'

export type QueryResultTableVariables = {
  projectRef?: string
  connectionString?: string | null
  sql?: string
  roleImpersonationState?: RoleImpersonationState
}

async function getQueryResultTable(args: QueryResultTableVariables, signal?: AbortSignal) {
  if (!args.projectRef || !args.sql) throw new Error('Project and query are required')
  const response = await fetchHandler(`${BASE_PATH}/api/parse-query`, {
    method: 'POST',
    headers: await constructHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ sql: args.sql }),
    signal,
  })
  // Unsupported syntax must not prevent displaying results.
  if (!response.ok) return null
  const { editableQuery } = z
    .object({ editableQuery: editableQuerySchema.nullable() })
    .parse(await response.json())
  if (!editableQuery) return null

  const relationName = editableQuery.schema
    ? `${ident(editableQuery.schema)}.${ident(editableQuery.table)}`
    : ident(editableQuery.table)
  const { result } = await executeSql(
    {
      ...args,
      sql: wrapWithRoleImpersonation(
        safeSql`
      select n.nspname as schema, c.relname as name
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      where c.oid = pg_catalog.to_regclass(${literal(relationName)})
        and c.relkind in ('r', 'p')
        and n.nspname !~ '^pg_'
        and not exists (
          select 1 from pg_catalog.pg_inherits i
          join pg_catalog.pg_class child on child.oid = i.inhrelid
          where i.inhparent = c.oid and not child.relispartition
        )
    `,
        args.roleImpersonationState
      ),
      isRoleImpersonationEnabled: isRoleImpersonationEnabled(args.roleImpersonationState?.role),
    },
    signal
  )
  const [relation] = z.array(z.object({ schema: z.string(), name: z.string() })).parse(result)
  if (!relation) return null
  const table = await getTable({ ...args, ...relation }, signal)
  const columns = getResultColumnMapping(editableQuery, table)
  return columns ? { table, columns } : null
}

export const queryResultTableQueryOptions = (args: QueryResultTableVariables) =>
  queryOptions({
    queryKey: sqlKeys.editableResult(args.projectRef, args),
    queryFn: ({ signal }) => getQueryResultTable(args, signal),
    enabled: !!args.projectRef && !!args.sql,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

export type QueryResultRowVariables = Omit<QueryResultTableVariables, 'sql'> & {
  table: { schema: string; name: string }
  identifiers: Record<string, unknown>
}

async function getQueryResultRow(args: QueryResultRowVariables, signal?: AbortSignal) {
  if (Object.keys(args.identifiers).length === 0) throw new Error('Row identifiers are required')
  const { result } = await executeSql(
    {
      ...args,
      sql: wrapWithRoleImpersonation(
        new Query()
          .from(args.table.name, args.table.schema)
          .select(safeSql`*`)
          .match(args.identifiers)
          .range(0, 1)
          .toSql(),
        args.roleImpersonationState
      ),
      isRoleImpersonationEnabled: isRoleImpersonationEnabled(args.roleImpersonationState?.role),
    },
    signal
  )
  const rows = z.array(z.record(z.unknown())).parse(result)
  if (rows.length !== 1)
    handleError({ message: 'This row is no longer available to edit. Run the query again.' })
  return rows[0]
}

export const queryResultRowQueryOptions = (args: QueryResultRowVariables) =>
  queryOptions({
    queryKey: sqlKeys.resultRow(args.projectRef, args),
    queryFn: ({ signal }) => getQueryResultRow(args, signal),
    enabled: !!args.projectRef,
    retry: false,
    staleTime: 0,
  })
