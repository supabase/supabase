export const databaseTriggerKeys = {
  list: (projectRef: string | undefined, schemas?: string[]) =>
    ['projects', projectRef, 'database-triggers', schemas].filter(Boolean),
  resource: (projectRef: string | undefined, id: string | undefined) =>
    ['projects', projectRef, 'resources', id] as const,
}
