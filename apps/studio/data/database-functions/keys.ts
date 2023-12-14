export const databaseFunctionsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'database-functions'] as const,
}
