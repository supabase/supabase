import pgMeta, {
  getTablePrivilegesStatementsSql,
  type TablePrivilegesGrant,
} from '@supabase/pg-meta'
import { joinSqlFragments, type SafeSqlFragment } from '@supabase/pg-meta/src/pg-format'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { invalidateTablePrivilegesQuery } from './table-privileges-query'
import type { ConnectionVars } from '@/data/common.types'
import { unguarded } from '@/data/fetchers'
import { lintKeys } from '@/data/lint/keys'
import { withSparkFallback } from '@/data/sql/catalog-fallback-query'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import {
  API_ACCESS_ROLES,
  API_PRIVILEGE_TYPES,
  type ApiPrivilegesByRole,
} from '@/lib/data-api-types'
import type { DeepReadonly } from '@/lib/type-helpers'
import type { UseCustomMutationOptions } from '@/types'

export type TableApiAccessPrivilegesVariables = ConnectionVars & {
  relationId: number
  /** The table's schema and name, for databases that cannot run the `DO` block (Spark). */
  schema: string
  name: string
  privileges: DeepReadonly<ApiPrivilegesByRole>
}

export async function updateTableApiAccessPrivileges({
  projectRef,
  connectionString,
  relationId,
  schema,
  name,
  privileges,
}: TableApiAccessPrivilegesVariables) {
  const sqlStatements: Array<SafeSqlFragment> = []
  const grants: TablePrivilegesGrant[] = []
  const revokes: TablePrivilegesGrant[] = []

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
      revokes.push(...revokeGrants)
      const revokeSql = pgMeta.tablePrivileges.revoke(revokeGrants).sql
      if (revokeSql) sqlStatements.push(revokeSql)
    }

    // Grant privileges that should be added
    if (privilegesToGrant.length > 0) {
      const grantGrants = privilegesToGrant.map((privilegeType) => ({
        grantee: role,
        privilegeType,
        relationId,
      }))
      grants.push(...grantGrants)
      const grantSql = pgMeta.tablePrivileges.grant(grantGrants).sql
      if (grantSql) sqlStatements.push(grantSql)
    }
  }

  if (sqlStatements.length === 0) {
    return null
  }

  const variables = {
    projectRef,
    connectionString,
    queryName: 'table-api-access-update-privileges',
    queryKey: ['table-api-access', 'update-privileges'],
    grant: unguarded.migrating,
  }
  const run = async (sql: SafeSqlFragment) =>
    (await executeSql<[]>({ ...variables, sqlOrigin: 'studio', sql })).result

  return withSparkFallback(
    projectRef,
    () => run(joinSqlFragments(sqlStatements, '\n')),
    () => run(getTablePrivilegesStatementsSql({ schema, name, grants, revokes }))
  )
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
