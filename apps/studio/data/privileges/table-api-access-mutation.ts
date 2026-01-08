import pgMeta from '@supabase/pg-meta'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import {
  API_ACCESS_ROLES,
  API_PRIVILEGE_TYPES,
  type ApiPrivilegesByRole,
} from '@/lib/data-api-types'
import type { DeepReadonly } from '@/lib/type-helpers'
import { executeSql } from 'data/sql/execute-sql-query'
import type { UseCustomMutationOptions } from 'types'
import type { ConnectionVars } from '../common.types'
import { lintKeys } from '../lint/keys'
import { invalidateTablePrivilegesQuery } from './table-privileges-query'

export type TableApiAccessPrivilegesVariables = ConnectionVars & {
  relationId: number
  privileges: DeepReadonly<ApiPrivilegesByRole>
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

  const { result } = await executeSql<[]>({
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
    Error,
    TableApiAccessPrivilegesVariables
  >,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<UpdateTableApiAccessPrivilegesData, Error, TableApiAccessPrivilegesVariables>({
    mutationFn: (vars) => updateTableApiAccessPrivileges(vars),
    async onSuccess(data, variables, context) {
      const { projectRef } = variables
      await Promise.all([
        invalidateTablePrivilegesQuery(queryClient, projectRef),
        // This affects the result of the RLS disabled lint, so we need to
        // invalidate it
        queryClient.invalidateQueries({
          queryKey: lintKeys.lint(projectRef),
        }),
      ])

      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to update API access privileges: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
