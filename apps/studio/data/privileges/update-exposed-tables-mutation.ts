import { useMutation } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import type { UseCustomMutationOptions } from 'types'

import type { ConnectionVars } from '../common.types'
import { IGNORED_SCHEMAS } from './exposed-tables-infinite-query'

export type UpdateExposedTablesVariables = ConnectionVars & {
  tableIdsToAdd: number[]
  tableIdsToRemove: number[]
}

const buildTablePrivilegesSql = (oids: number[], action: 'grant' | 'revoke') => {
  if (oids.length === 0) return ''

  const privilegeClause =
    action === 'grant'
      ? 'grant select, insert, update, delete on table %s to anon, authenticated, service_role'
      : 'revoke all on table %s from anon, authenticated, service_role'

  return /* SQL */ `
    do $$
    declare
      rec record;
    begin
      for rec in
        select quote_ident(n.nspname) || '.' || quote_ident(c.relname) as relation
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where c.oid in (${oids.join(', ')})
      loop
        execute format('${privilegeClause}', rec.relation);
      end loop;
    end $$;
  `
}

const ignoredSchemasList = IGNORED_SCHEMAS.map((s) => `'${s}'`).join(', ')

const EXPOSED_SCHEMAS_SQL = /* SQL */ `
  select coalesce(
    (
      select jsonb_agg(distinct schema_name order by schema_name)
      from (
        select n.nspname as schema_name
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        left join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) as acl on true
        where c.relkind in ('r', 'p', 'v', 'm', 'f')
          and n.nspname not in (${ignoredSchemasList})
        group by c.oid, n.nspname
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
      ) t
    ),
    '[]'::jsonb
  ) as schemas;
`

export async function updateExposedTables({
  projectRef,
  connectionString,
  tableIdsToAdd,
  tableIdsToRemove,
}: UpdateExposedTablesVariables): Promise<string[]> {
  if (!projectRef) throw new Error('projectRef is required')

  const sqlParts: string[] = []

  if (tableIdsToAdd.length > 0) {
    sqlParts.push(buildTablePrivilegesSql(tableIdsToAdd, 'grant'))
  }

  if (tableIdsToRemove.length > 0) {
    sqlParts.push(buildTablePrivilegesSql(tableIdsToRemove, 'revoke'))
  }

  sqlParts.push(EXPOSED_SCHEMAS_SQL)

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: sqlParts.join('\n'),
    queryKey: ['update-exposed-tables'],
  })

  return (result[0] as { schemas: string[] }).schemas
}

type UpdateExposedTablesData = Awaited<ReturnType<typeof updateExposedTables>>

export const useUpdateExposedTablesMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<UpdateExposedTablesData, Error, UpdateExposedTablesVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UpdateExposedTablesData, Error, UpdateExposedTablesVariables>({
    mutationFn: (vars: UpdateExposedTablesVariables) => updateExposedTables(vars),
    onError(error: Error) {
      toast.error(`Failed to update table access: ${error.message}`)
    },
    ...(onError ? { onError } : {}),
    ...options,
  })
}
