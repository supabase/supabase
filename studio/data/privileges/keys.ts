export const privilegeKeys = {
  tablePrivilegesList: (projectRef: string | undefined) =>
    [projectRef, 'database', 'table-privileges'] as const,
  columnPrivilegesList: (projectRef: string | undefined) =>
    [projectRef, 'database', 'column-privileges'] as const,
}
