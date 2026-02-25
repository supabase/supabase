import { infiniteQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'

import { privilegeKeys } from './keys'
import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'

export const EXPOSED_TABLES_PAGE_LIMIT = 50

export type ExposedTablesVariables = {
  projectRef?: string
  connectionString?: string | null
}

export type ExposedTable = {
  id: number
  schema: string
  name: string
}

export type ExposedTablesResponse = {
  total_count: number
  tables: ExposedTable[]
}

export async function getExposedTables(
  {
    projectRef,
    connectionString,
    page = 0,
    limit = EXPOSED_TABLES_PAGE_LIMIT,
  }: ExposedTablesVariables & { page?: number; limit?: number },
  signal?: AbortSignal
): Promise<ExposedTablesResponse> {
  if (!projectRef) throw new Error('projectRef is required')

  const offset = page * limit

  const sql = /* SQL */ `
    with table_grants as (
      select
        c.oid::text as id,
        n.nspname as schema_name,
        c.relname as name,
        c.relkind as kind
      from pg_class c
      join pg_namespace n
        on n.oid = c.relnamespace
      left join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) as acl
        on true
      where c.relkind in ('r', 'p', 'v', 'm', 'f')
        and n.nspname not in (${INTERNAL_SCHEMAS.map((s) => `'${s}'`).join(', ')})
      group by c.oid, n.nspname, c.relname, c.relkind
      having
        bool_or(
          pg_catalog.pg_get_userbyid(acl.grantee) = 'anon'
          and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
        )
        and bool_or(
          pg_catalog.pg_get_userbyid(acl.grantee) = 'authenticated'
          and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
        )
        and bool_or(
          pg_catalog.pg_get_userbyid(acl.grantee) = 'service_role'
          and acl.privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
        )
      order by n.nspname, c.relname
    ),
    total as (
      select count(*) as count from table_grants
    )
    select
      (select count from total)::int as total_count,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', tg.id,
              'schema', tg.schema_name,
              'name', tg.name
            )
          )
          from (
            select *
            from table_grants
            offset ${offset}
            limit ${limit}
          ) tg
        ),
        '[]'::jsonb
      ) as tables;
  `

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['exposed-tables', page],
    },
    signal
  )

  return result[0] as ExposedTablesResponse
}

export type ExposedTablesData = Awaited<ReturnType<typeof getExposedTables>>
export type ExposedTablesError = ResponseError

export const exposedTablesInfiniteQueryOptions = (
  { projectRef, connectionString }: ExposedTablesVariables,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return infiniteQueryOptions({
    queryKey: privilegeKeys.exposedTablesInfinite(projectRef),
    queryFn: ({ signal, pageParam }) =>
      getExposedTables(
        {
          projectRef,
          connectionString,
          page: pageParam,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
    initialPageParam: 0,
    getNextPageParam(lastPage, pages) {
      const page = pages.length
      const currentTotalCount = page * EXPOSED_TABLES_PAGE_LIMIT
      const totalCount = lastPage.total_count ?? 0

      if (currentTotalCount >= totalCount) {
        return undefined
      }

      return page
    },
  })
}
