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
  status: 'granted' | 'revoked' | 'custom'
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
    with table_privileges as (
      select
        c.oid::int as id,
        n.nspname as schema_name,
        c.relname as name,
        c.relkind as kind,
        
        -- Anon Privileges
        bool_or(pr.rolname = 'anon' and acl.privilege_type = 'SELECT') as anon_select,
        bool_or(pr.rolname = 'anon' and acl.privilege_type = 'INSERT') as anon_insert,
        bool_or(pr.rolname = 'anon' and acl.privilege_type = 'UPDATE') as anon_update,
        bool_or(pr.rolname = 'anon' and acl.privilege_type = 'DELETE') as anon_delete,
        
        -- Authenticated Privileges
        bool_or(pr.rolname = 'authenticated' and acl.privilege_type = 'SELECT') as auth_select,
        bool_or(pr.rolname = 'authenticated' and acl.privilege_type = 'INSERT') as auth_insert,
        bool_or(pr.rolname = 'authenticated' and acl.privilege_type = 'UPDATE') as auth_update,
        bool_or(pr.rolname = 'authenticated' and acl.privilege_type = 'DELETE') as auth_delete,
        
        -- Service Role Privileges
        bool_or(pr.rolname = 'service_role' and acl.privilege_type = 'SELECT') as srv_select,
        bool_or(pr.rolname = 'service_role' and acl.privilege_type = 'INSERT') as srv_insert,
        bool_or(pr.rolname = 'service_role' and acl.privilege_type = 'UPDATE') as srv_update,
        bool_or(pr.rolname = 'service_role' and acl.privilege_type = 'DELETE') as srv_delete
    
      from pg_class c
      join pg_namespace n
        on n.oid = c.relnamespace
      left join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) as acl
        on true
      left join pg_roles pr
        on pr.oid = acl.grantee
      where c.relkind in ('r', 'p', 'v', 'm', 'f')
        and n.nspname not in (${IGNORED_SCHEMAS.map((s) => `'${s}'`).join(', ')})
        ${search ? `and (n.nspname || '.' || c.relname) ilike '%${search}%'` : ''}
      group by c.oid, n.nspname, c.relname, c.relkind
    ),
    table_grants as (
      select
        id,
        schema_name,
        name,
        kind,
        CASE
          -- 1. Strict Granted: All 3 roles possess ALL 4 privileges
          WHEN (
            anon_select and anon_insert and anon_update and anon_delete and
            auth_select and auth_insert and auth_update and auth_delete and
            srv_select and srv_insert and srv_update and srv_delete
          ) THEN 'granted'
          
          -- 2. Strict Revoked: NO role possesses ANY privilege
          WHEN NOT (
            anon_select or anon_insert or anon_update or anon_delete or
            auth_select or auth_insert or auth_update or auth_delete or
            srv_select or srv_insert or srv_update or srv_delete
          ) THEN 'revoked'
          
          -- 3. Custom: Anything in between
          ELSE 'custom'
        END as status
      from table_privileges
    ),
    -- Combine counts into a single CTE pass using FILTER
    stats as (
      select
        count(*)::int as total_count,
        -- Count as granted if the status is anything other than 'revoked'
        count(*) filter (where status in ('granted', 'custom'))::int as grants_count
      from table_grants
    )
    select
      (select total_count from stats) as total_count,
      (select grants_count from stats) as grants_count,
      coalesce(
        (
          select jsonb_agg(
            jsonb_build_object(
              'id', tg.id,
              'schema', tg.schema_name,
              'name', tg.name,
              'status', tg.status -- The new single string output
            )
          )
          from (
            select *
            from table_grants
            order by schema_name, name
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
