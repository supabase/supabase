export const databaseIndexesKeys = {
  list: (projectRef: string | undefined, schema?: string) =>
    ['projects', projectRef, 'database-indexes', schema].filter(Boolean),
}
