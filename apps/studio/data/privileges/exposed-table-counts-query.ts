import { queryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'

import { IGNORED_SCHEMAS } from './exposed-tables-infinite-query'
import { privilegeKeys } from './keys'

export type ExposedTableCountsVariables = {
  projectRef?: string
  connectionString?: string | null
  selectedSchemas: string[]
}

export type ExposedTableCountsResponse = {
  total_count: number
  grants_count: number
}

export async function getExposedTableCounts(
  {
    projectRef,
    connectionString,
    selectedSchemas,
  }: ExposedTableCountsVariables,
  signal?: AbortSignal
): Promise<ExposedTableCountsResponse> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!selectedSchemas) throw new Error('selectedSchemas is required')

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
    stats as (
      select
        count(*)::int as total_count,
        count(*) filter (
          where status = 'granted' 
          and schema_name in (${selectedSchemas.length > 0 ? selectedSchemas.map((s) => `'${s}'`).join(', ') : "''"})
        )::int as grants_count
      from table_grants
    )
    select * from stats;
  `

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['exposed-table-counts', selectedSchemas],
    },
    signal
  )

  return result[0] as ExposedTableCountsResponse
}

export type ExposedTableCountsData = Awaited<ReturnType<typeof getExposedTableCounts>>
export type ExposedTableCountsError = ResponseError

export const exposedTableCountsQueryOptions = (
  { projectRef, connectionString, selectedSchemas }: ExposedTableCountsVariables,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return queryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- connection string doesn't change the result of the query
    queryKey: privilegeKeys.exposedTableCounts(projectRef, selectedSchemas),
    queryFn: ({ signal }) =>
      getExposedTableCounts(
        {
          projectRef,
          connectionString,
          selectedSchemas,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
  })
}
