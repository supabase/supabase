export const databaseTriggerKeys = {
  list: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database-triggers'].filter(Boolean),
  resource: (projectRef: string | undefined, id: string | undefined) =>
    ['projects', projectRef, 'resources', id] as const,
}
