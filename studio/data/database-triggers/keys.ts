export const databaseTriggerKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'database-triggers'] as const,
  resource: (projectRef: string | undefined, id: string | undefined) =>
    ['projects', projectRef, 'resources', id] as const,
}
