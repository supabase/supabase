import { queryOptions, useQuery } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'

import { IGNORED_SCHEMAS } from './exposed-tables-infinite-query'
import { privilegeKeys } from './keys'

export type ExposeMode = 'schemas' | 'specific'

export type ExposeModeVariables = {
  projectRef?: string
  connectionString?: string | null
  schemas: string[]
}

async function getExposeMode(
  { projectRef, connectionString, schemas }: ExposeModeVariables,
  signal?: AbortSignal
): Promise<ExposeMode> {
  if (!projectRef) throw new Error('projectRef is required')
  if (schemas.length === 0) return 'schemas'

  const schemaList = schemas
    .filter((s) => !IGNORED_SCHEMAS.includes(s))
    .map((s) => `'${s}'`)
    .join(', ')

  if (!schemaList) return 'schemas'

  const sql = /* SQL */ `
    select exists(
      select 1
      from pg_class c
      join pg_namespace n
        on n.oid = c.relnamespace
      left join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) as acl
        on true
      where c.relkind in ('r', 'p', 'v', 'm', 'f')
        and n.nspname in (${schemaList})
      group by c.oid
      having not (
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
      )
    ) as has_ungrouped_tables;
  `

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['expose-mode'],
    },
    signal
  )

  return (result[0] as { has_ungrouped_tables: boolean }).has_ungrouped_tables
    ? 'specific'
    : 'schemas'
}

export const exposeModeQueryOptions = (
  { projectRef, connectionString, schemas }: ExposeModeVariables,
  { enabled = true }: { enabled?: boolean } = {}
) =>
  queryOptions<ExposeMode, ExecuteSqlError>({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- project-level cache entry; schemas scope the SQL but don't differentiate cache entries
    queryKey: privilegeKeys.exposeMode(projectRef),
    queryFn: ({ signal }) => getExposeMode({ projectRef, connectionString, schemas }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
  })
