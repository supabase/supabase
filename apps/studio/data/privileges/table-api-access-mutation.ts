import pgMeta from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomMutationOptions } from 'types'
import {
  API_ACCESS_ROLES,
  API_PRIVILEGE_TYPES,
  ApiPrivilegesPerRole,
  invalidateTableApiAccessQuery,
} from './table-api-access-query'
import { invalidateTablePrivilegesQuery } from './table-privileges-query'

export type TableApiAccessVariables = {
  projectRef: string
  connectionString?: string | null
  relationId: number
}

export type TableApiAccessPrivilegesVariables = {
  projectRef: string
  connectionString?: string | null
  relationId: number
  privileges: ApiPrivilegesPerRole
}

export async function updateTableApiAccessPrivileges({
  projectRef,
  connectionString,
  relationId,
  privileges,
}: TableApiAccessPrivilegesVariables) {
  const sqlStatements: string[] = []

  for (const role of API_ACCESS_ROLES) {
    const rolePrivileges = privileges[role]

    // Determine which privileges to grant and revoke for this role
    const privilegesToGrant = rolePrivileges
    const privilegesToRevoke = API_PRIVILEGE_TYPES.filter((p) => !rolePrivileges.includes(p))

    // Revoke privileges that should be removed
    if (privilegesToRevoke.length > 0) {
      const revokeGrants = privilegesToRevoke.map((privilegeType) => ({
        grantee: role,
        privilegeType,
        relationId,
      }))
      const revokeSql = pgMeta.tablePrivileges.revoke(revokeGrants).sql.trim()
      if (revokeSql) sqlStatements.push(revokeSql)
    }

    // Grant privileges that should be added
    if (privilegesToGrant.length > 0) {
      const grantGrants = privilegesToGrant.map((privilegeType) => ({
        grantee: role,
        privilegeType,
        relationId,
      }))
      const grantSql = pgMeta.tablePrivileges.grant(grantGrants).sql.trim()
      if (grantSql) sqlStatements.push(grantSql)
    }
  }

  if (sqlStatements.length === 0) {
    return null
  }

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: sqlStatements.join('\n'),
    queryKey: ['table-api-access', 'update-privileges'],
  })

  return result
}

type UpdateTableApiAccessPrivilegesData = Awaited<ReturnType<typeof updateTableApiAccessPrivileges>>

export const useTableApiAccessPrivilegesMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<
    UpdateTableApiAccessPrivilegesData,
    ResponseError,
    TableApiAccessPrivilegesVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<
    UpdateTableApiAccessPrivilegesData,
    ResponseError,
    TableApiAccessPrivilegesVariables
  >({
    mutationFn: (vars: TableApiAccessPrivilegesVariables) => updateTableApiAccessPrivileges(vars),
    async onSuccess(
      data: UpdateTableApiAccessPrivilegesData,
      variables: TableApiAccessPrivilegesVariables,
      context: unknown
    ) {
      const { projectRef, relationId } = variables

      await Promise.all([
        invalidateTablePrivilegesQuery(queryClient, projectRef),
        invalidateTableApiAccessQuery(queryClient, projectRef, relationId),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(
      data: ResponseError,
      variables: TableApiAccessPrivilegesVariables,
      context: unknown
    ) {
      if (onError === undefined) {
        toast.error(`Failed to update API access privileges: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
