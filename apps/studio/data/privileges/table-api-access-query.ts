import { QueryClient } from '@tanstack/react-query'

import type { ExecuteSqlError } from 'data/sql/execute-sql-query'
import { privilegeKeys } from './keys'
import { TablePrivilegesGrant } from './table-privileges-grant-mutation'
import { TablePrivilegesData, useTablePrivilegesQuery } from './table-privileges-query'

export const API_ACCESS_ROLES = ['anon', 'authenticated'] as const
export type ApiAccessRole = (typeof API_ACCESS_ROLES)[number]

export type ApiPrivilegeType = TablePrivilegesGrant['privilegeType']

export const API_PRIVILEGE_TYPES: ApiPrivilegeType[] = ['SELECT', 'INSERT', 'UPDATE', 'DELETE']

export type ApiPrivilegesPerRole = {
  anon: ApiPrivilegeType[]
  authenticated: ApiPrivilegeType[]
}

export type TableApiAccessVariables = {
  projectRef?: string
  connectionString?: string | null
  relationId?: number
  schema?: string
  tableName?: string
}

export type TableApiAccessData = {
  hasApiAccess: boolean
  privileges: ApiPrivilegesPerRole
}
export type TableApiAccessError = ExecuteSqlError

const hasValidTarget = ({ relationId, schema, tableName }: TableApiAccessVariables) =>
  !!relationId || (!!schema && !!tableName)

const mapPrivilegesToApiAccess = (
  data: TablePrivilegesData | undefined,
  relationId?: number,
  schema?: string,
  tableName?: string
): TableApiAccessData => {
  const target = (data ?? []).find((entry) =>
    relationId
      ? entry.relation_id === relationId
      : entry.schema === schema && entry.name === tableName
  )

  const allPrivileges = target?.privileges ?? []

  // Get privileges per role
  const privilegesPerRole: ApiPrivilegesPerRole = { anon: [], authenticated: [] }

  for (const role of API_ACCESS_ROLES) {
    const rolePrivileges = allPrivileges
      .filter((p) => p.grantee === role)
      .map((p) => p.privilege_type as ApiPrivilegeType)
      .filter((p) => API_PRIVILEGE_TYPES.includes(p))

    privilegesPerRole[role] = rolePrivileges
  }

  const hasApiAccess =
    privilegesPerRole.anon.length > 0 || privilegesPerRole.authenticated.length > 0

  return {
    hasApiAccess,
    privileges: privilegesPerRole,
  }
}

export const useTableApiAccessQuery = (
  variables: TableApiAccessVariables,
  { enabled = true }: { enabled?: boolean } = {}
) =>
  useTablePrivilegesQuery<TableApiAccessData>(
    { projectRef: variables.projectRef, connectionString: variables.connectionString },
    {
      select: (data: TablePrivilegesData | undefined) =>
        mapPrivilegesToApiAccess(data, variables.relationId, variables.schema, variables.tableName),
      enabled:
        enabled &&
        !!variables.projectRef &&
        !!variables.connectionString &&
        hasValidTarget(variables),
    }
  )

export function invalidateTableApiAccessQuery(
  client: QueryClient,
  projectRef: string | undefined,
  relationId: number | undefined,
  tableName?: string
) {
  return client.invalidateQueries({
    queryKey: privilegeKeys.tableApiAccess(projectRef, relationId, tableName),
  })
}
