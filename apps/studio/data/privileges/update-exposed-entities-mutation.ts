import { useMutation } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import { toast } from 'sonner'
import type { UseCustomMutationOptions } from 'types'

import type { ConnectionVars } from '../common.types'
import { getExposedSchemasSql } from './privileges.sql'

export type UpdateExposedEntitiesVariables = ConnectionVars & {
  tableIdsToAdd: number[]
  tableIdsToRemove: number[]
  functionNamesToAdd: string[]
  functionNamesToRemove: string[]
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

const buildFunctionPrivilegesSql = (schemaNames: string[], action: 'grant' | 'revoke') => {
  if (schemaNames.length === 0) return ''

  const tuples = schemaNames
    .map((sn) => {
      const dotIdx = sn.indexOf('.')
      const schema = sn.slice(0, dotIdx)
      const name = sn.slice(dotIdx + 1)
      return `('${schema}','${name}')`
    })
    .join(', ')

  const privilegeClause =
    action === 'grant'
      ? 'grant execute on function %s to anon, authenticated, service_role'
      : 'revoke all on function %s from anon, authenticated, service_role'

  return /* SQL */ `
    do $$
    declare
      rec record;
    begin
      for rec in
        select quote_ident(n.nspname) || '.' || quote_ident(p.proname)
          || '(' || pg_get_function_identity_arguments(p.oid) || ')' as func_sig
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where (n.nspname, p.proname) in (${tuples})
      loop
        execute format('${privilegeClause}', rec.func_sig);
      end loop;
    end $$;
  `
}

export async function updateExposedEntities({
  projectRef,
  connectionString,
  tableIdsToAdd,
  tableIdsToRemove,
  functionNamesToAdd,
  functionNamesToRemove,
}: UpdateExposedEntitiesVariables): Promise<string[]> {
  if (!projectRef) throw new Error('projectRef is required')

  const sqlParts: string[] = []

  if (tableIdsToAdd.length > 0) {
    sqlParts.push(buildTablePrivilegesSql(tableIdsToAdd, 'grant'))
  }

  if (tableIdsToRemove.length > 0) {
    sqlParts.push(buildTablePrivilegesSql(tableIdsToRemove, 'revoke'))
  }

  if (functionNamesToAdd.length > 0) {
    sqlParts.push(buildFunctionPrivilegesSql(functionNamesToAdd, 'grant'))
  }

  if (functionNamesToRemove.length > 0) {
    sqlParts.push(buildFunctionPrivilegesSql(functionNamesToRemove, 'revoke'))
  }

  sqlParts.push(getExposedSchemasSql())

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: sqlParts.join('\n'),
    queryKey: ['update-exposed-entities'],
  })

  return (result[0] as { schemas: string[] }).schemas
}

type UpdateExposedEntitiesData = Awaited<ReturnType<typeof updateExposedEntities>>

export const useUpdateExposedEntitiesMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<UpdateExposedEntitiesData, Error, UpdateExposedEntitiesVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<UpdateExposedEntitiesData, Error, UpdateExposedEntitiesVariables>({
    mutationFn: (vars: UpdateExposedEntitiesVariables) => updateExposedEntities(vars),
    onError(error: Error) {
      toast.error(`Failed to update entity access: ${error.message}`)
    },
    ...(onError ? { onError } : {}),
    ...options,
  })
}
