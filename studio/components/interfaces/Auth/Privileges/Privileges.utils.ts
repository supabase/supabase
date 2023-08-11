import { ColumnPrivilegesData } from 'data/privileges/column-privileges-query'
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
