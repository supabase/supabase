import { infiniteQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'

import { privilegeKeys } from './keys'
import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'

export const EXPOSED_TABLES_PAGE_LIMIT = 50
export const IGNORED_SCHEMAS = [...INTERNAL_SCHEMAS, 'pg_catalog']

export type ExposedTablesVariables = {
  projectRef?: string
  connectionString?: string | null
  search?: string
}

export type ExposedTable = {
  id: number
  schema: string
  name: string
  has_grants: boolean
}

export type ExposedTablesResponse = {
  total_count: number
  grants_count: number
  tables: ExposedTable[]
}

export async function getExposedTables(
  {
    projectRef,
    connectionString,
    search,
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
        c.oid::int as id,
        n.nspname as schema_name,
        c.relname as name,
        c.relkind as kind,
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
        ) as has_grants
      from pg_class c
      join pg_namespace n
        on n.oid = c.relnamespace
      left join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) as acl
        on true
      where c.relkind in ('r', 'p', 'v', 'm', 'f')
        and n.nspname not in (${IGNORED_SCHEMAS.map((s) => `'${s}'`).join(', ')})
        ${search ? `and (n.nspname || '.' || c.relname) ilike '%${search}%'` : ''}
      group by c.oid, n.nspname, c.relname, c.relkind
      order by n.nspname, c.relname
    ),
    total as (
      select count(*) as count from table_grants
    ),
    grants_total as (
      select count(*) as count from table_grants where has_grants
    )
    select
      (select count from total)::int as total_count,
      (select count from grants_total)::int as grants_count,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', tg.id,
              'schema', tg.schema_name,
              'name', tg.name,
              'has_grants', tg.has_grants
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
  { projectRef, connectionString, search }: ExposedTablesVariables,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return infiniteQueryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- connection string doesn't change the result of the query
    queryKey: privilegeKeys.exposedTablesInfinite(projectRef, search),
    queryFn: ({ signal, pageParam }) =>
      getExposedTables(
        {
          projectRef,
          connectionString,
          search,
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
