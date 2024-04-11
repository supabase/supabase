export const databaseKeys = {
  schemaList: (projectRef: string | undefined) => ['projects', projectRef, 'schemas'] as const,
  backups: (projectRef: string | undefined) => [projectRef, 'database', 'backups'] as const,
  poolingConfiguration: (projectRef: string | undefined) =>
    [projectRef, 'database', 'pooling-configuration'] as const,
  indexesFromQuery: (projectRef: string | undefined, query: string) =>
    ['projects', projectRef, 'indexes', { query }] as const,
  indexAdvisorFromQuery: (projectRef: string | undefined, query: string) =>
    ['projects', projectRef, 'index-advisor', { query }] as const,
}
