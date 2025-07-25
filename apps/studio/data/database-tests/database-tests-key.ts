export const databaseTestsKeys = {
  list: (projectRef: string | undefined) => [projectRef, 'database-tests'] as const,
  detail: (projectRef: string | undefined, id: string | undefined) =>
    [projectRef, 'database-tests', id] as const,
}
