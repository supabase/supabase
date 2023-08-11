export const databaseKeys = {
  poolingConfiguration: (projectRef: string | undefined) =>
    [projectRef, 'database', 'pooling-configuration'] as const,
}
