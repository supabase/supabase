export const databaseQueuesKeys = {
  create: () => ['queues', 'create'] as const,
  delete: () => ['queues', 'delete'] as const,
  getMessagesInfinite: (projectRef: string | undefined, queueName: string, options?: object) =>
    ['projects', projectRef, 'queues', queueName, options].filter(Boolean),
  list: (projectRef: string | undefined) => ['projects', projectRef, 'queues'] as const,
}
