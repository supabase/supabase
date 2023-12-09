import { ColumnPrivilegesGrant } from 'data/privileges/column-privileges-grant-mutation'
import { ColumnPrivilegesData } from 'data/privileges/column-privileges-query'
import { ColumnPrivilegesRevoke } from 'data/privileges/column-privileges-revoke-mutation'
import { TablePrivilegesGrant } from 'data/privileges/table-privileges-grant-mutation'
import { TablePrivilegesRevoke } from 'data/privileges/table-privileges-revoke-mutation'
import { PrivilegeColumnUI } from './Privileges.types'

export function mapDataToPrivilegeColumnUI(
  data: ColumnPrivilegesData | undefined,
  schema: string,
  table: string,
  role: string
): PrivilegeColumnUI[] {
  if (data === undefined) return []

  return data
    .filter((c) => c.relation_schema === schema && c.relation_name === table)
    .map((c) => ({
      id: c.column_id,
      name: c.column_name,
      privileges: c.privileges.filter((p) => p.grantee === role).map((p) => p.privilege_type),
    }))
}

export function getPrivilegesLoadingKey(
  type: 'table' | 'column',
  grant:
    | TablePrivilegesGrant
    | TablePrivilegesRevoke
    | ColumnPrivilegesGrant
    | ColumnPrivilegesRevoke
) {
  if ('relation_id' in grant) {
    return `${type}-${grant.relation_id}-${grant.grantee}-${grant.privilege_type}`
  }

  if ('column_id' in grant) {
    return `${type}-${grant.column_id}-${grant.grantee}-${grant.privilege_type}`
  }

  throw new Error('Invalid grant type')
}

export function isPrivilegesLoading(
  loadingStates: Set<string>,
  type: 'table' | 'column',
  grant:
    | TablePrivilegesGrant
    | TablePrivilegesRevoke
    | ColumnPrivilegesGrant
    | ColumnPrivilegesRevoke
) {
  return loadingStates.has(getPrivilegesLoadingKey(type, grant))
}
