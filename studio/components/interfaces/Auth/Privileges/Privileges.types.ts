export type PrivilegesDataUI = {
  schema: string
  table: string
  role: string
  columns: PrivilegeColumnUI[]
}

export type PrivilegeColumnUI = {
  name: string
  privileges: string[]
}
