export const databaseQueuesKeys = {
  create: () => ['queues', 'create'] as const,
  delete: (name: string) => ['queues', name, 'delete'] as const,
  purge: (name: string) => ['queues', name, 'purge'] as const,
  getMessagesInfinite: (projectRef: string | undefined, queueName: string, options?: object) =>
    ['projects', projectRef, 'queue-messages', queueName, options].filter(Boolean),
  list: (projectRef: string | undefined) => ['projects', projectRef, 'queues'] as const,
  // invalidating queues.list will also invalidate queues.metrics
  // [Joshen TODO] I changed this to not ^ behave that way -> cause deleting a queue will
  // cause this unnecessary invalidation, JFYI -> can remove this comment once informed Ivan
  metrics: (projectRef: string | undefined, queueName: string) =>
    ['projects', projectRef, 'queue-metrics', queueName] as const,
  exposePostgrestStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'queue-expose-status'] as const,
}
