export const databaseExtensionsKeys = {
  list: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database-extensions'] as const,
  defaultSchema: (projectRef: string | undefined, extension: string | undefined) =>
    ['projects', projectRef, 'database-extensions', extension, 'default-schema'] as const,
}
