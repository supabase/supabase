export const databaseRoleKeys = {
  databaseRoles: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database-roles'] as const,
}
