export const databaseExtensionsKeys = {
  list: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database-extensions'] as const,
}
