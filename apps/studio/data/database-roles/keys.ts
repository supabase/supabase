export const databaseRolesKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'database-roles'] as const,
}
