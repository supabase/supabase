export const databaseEventTriggerKeys = {
  list: (projectRef: string | undefined) =>
    ['projects', projectRef, 'database-event-triggers'] as const,
}
