export const privilegeKeys = {
  tablePrivilegesList: (projectRef: string | undefined) =>
    [projectRef, 'database', 'table-privileges'] as const,
  columnPrivilegesList: (projectRef: string | undefined) =>
    [projectRef, 'database', 'column-privileges'] as const,
  tableApiAccess: (
    projectRef: string | undefined,
    relationId: number | undefined,
    tableName?: string
  ) => [projectRef, 'database', 'table-api-access', relationId ?? tableName] as const,
}
