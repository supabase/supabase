export const databaseColumnsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'database-columns'] as const,
}
