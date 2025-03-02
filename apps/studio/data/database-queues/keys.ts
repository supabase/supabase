export const databaseQueuesKeys = {
  create: () => ['queues', 'create'] as const,
  delete: (name: string) => ['queues', name, 'delete'] as const,
  purge: (name: string) => ['queues', name, 'purge'] as const,
  getMessagesInfinite: (projectRef: string | undefined, queueName: string, options?: object) =>
    ['projects', projectRef, 'queue-messages', queueName, options].filter(Boolean),
  list: (projectRef: string | undefined) => ['projects', projectRef, 'queues'] as const,
  metrics: (projectRef: string | undefined, queueName: string) =>
    ['projects', projectRef, 'queue-metrics', queueName] as const,
  exposePostgrestStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'queue-expose-status'] as const,
}
