export type PrivilegesDataUI = Record<string, Record<string, Record<string, PrivilegeColumnUI[]>>>

export type PrivilegeColumnUI = {
  name: string
  privileges: string[]
}

export type PrivilegeDataCalculation = Record<
  string,
  Record<
    string,
    Record<
      string,
      Record<
        string,
        {
          columnsOn: string[]
          columnsOff: string[]
        }
      >
    >
  >
>
