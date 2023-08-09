import { PrivilegesData } from 'data/database/privileges-query'
import { PrivilegeColumnUI } from './Privileges.types'

export function mapDataToPrivilegeColumnUI(
  data: PrivilegesData | undefined,
  schema: string,
  table: string,
  role: string
): PrivilegeColumnUI[] {
  if (data === undefined) return []

  return data
    .filter((c) => c.relation_schema === schema && c.relation_name === table)
    .map((c) => ({
      name: c.column_name,
      privileges: c.privileges.filter((p) => p.grantee === role).map((p) => p.privilege_type),
    }))
}

export function arePrivilegesEqual(a: PrivilegeColumnUI[], b: PrivilegeColumnUI[]) {
  return a.every((column) => {
    const columnB = b.find((c) => c.name === column.name)
    return (
      columnB &&
      column.privileges.every((privilege) => columnB.privileges.includes(privilege)) &&
      columnB.privileges.every((privilege) => column.privileges.includes(privilege))
    )
  })
}
