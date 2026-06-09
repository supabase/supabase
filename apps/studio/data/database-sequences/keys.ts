export const databaseSequencesKeys = {
  list: (projectRef: string | undefined, schema?: string) =>
    ['projects', projectRef, 'database-sequences', schema].filter(Boolean),
}
