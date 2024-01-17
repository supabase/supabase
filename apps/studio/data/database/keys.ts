export const databaseKeys = {
  schemaList: (projectRef: string | undefined) => ['projects', projectRef, 'schemas'] as const,
  postgresTypes: (projectRef: string | undefined) => ['projects', projectRef, 'types'] as const,
  backups: (projectRef: string | undefined) => [projectRef, 'database', 'backups'] as const,
  poolingConfiguration: (projectRef: string | undefined) =>
    [projectRef, 'database', 'pooling-configuration'] as const,
}
