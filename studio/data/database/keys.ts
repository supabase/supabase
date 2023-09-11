export const databaseKeys = {
  schemaList: (projectRef: string | undefined) => ['projects', projectRef, 'schemas'] as const,
  schema: (projectRef: string | undefined, id: string | undefined) =>
    ['projects', projectRef, 'schemas', id] as const,
  backups: (projectRef: string | undefined) => [projectRef, 'database', 'backups'] as const,
  poolingConfiguration: (projectRef: string | undefined) =>
    [projectRef, 'database', 'pooling-configuration'] as const,
}
