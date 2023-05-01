export type PrivilegesState = Record<string, Record<string, Record<string, PrivilegeColumnUI[]>>>

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

export type PrivilegeDataCalculation = {
  schema: string
  table: string
  role: string
  privilegeColumns: Record<
    string,
    {
      columnsOn: string[]
      columnsOff: string[]
    }
  >
}
