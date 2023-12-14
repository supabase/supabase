export const databasePublicationsKeys = {
  list: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database-publications'] as const,
}
