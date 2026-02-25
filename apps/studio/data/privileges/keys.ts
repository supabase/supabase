export const privilegeKeys = {
  tablePrivilegesList: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database', 'table-privileges'] as const,
  columnPrivilegesList: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database', 'column-privileges'] as const,
  exposedTablesInfinite: (projectRef: string | undefined) =>
    ['projects', projectRef, 'privileges', 'exposed-tables-infinite'] as const,
}
