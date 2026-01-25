export const privilegeKeys = {
  tablePrivilegesList: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database', 'table-privileges'] as const,
  columnPrivilegesList: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database', 'column-privileges'] as const,
}
