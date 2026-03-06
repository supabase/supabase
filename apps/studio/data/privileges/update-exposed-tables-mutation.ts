import { useMutation } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import type { UseCustomMutationOptions } from 'types'

import type { ConnectionVars } from '../common.types'
import { getExposedSchemasSql } from './privileges.sql'

export type UpdateExposedTablesVariables = ConnectionVars & {
  tableIdsToAdd: number[]
  tableIdsToRemove: number[]
}

const buildTablePrivilegesSql = (oids: number[], action: 'grant' | 'revoke') => {
  if (oids.length === 0) return ''

  const privilegeClause =
    action === 'grant'
      ? 'grant select, insert, update, delete on table %I.%I to anon, authenticated, service_role'
      : 'revoke all on table %I.%I from anon, authenticated, service_role'

  return /* SQL */ `
    do $$
    declare
      relname name;
      nspname name;
    begin
      for nspname, relname in
        select n.nspname, c.relname
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where c.oid in (${oids.join(', ')})
      loop
        execute format('${privilegeClause}', relname, nspname);
      end loop;
    end $$;
  `
}

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

  sqlParts.push(getExposedSchemasSql())

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
