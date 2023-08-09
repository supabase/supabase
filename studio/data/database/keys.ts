export const databaseKeys = {
  poolingConfiguration: (projectRef: string | undefined) =>
    [projectRef, 'database', 'pooling-configuration'] as const,
  privilegesList: (projectRef: string | undefined) =>
    [projectRef, 'database', 'privileges'] as const,
}
