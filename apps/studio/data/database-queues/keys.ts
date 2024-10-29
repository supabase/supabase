export const databaseQueuesKeys = {
  create: () => ['queues', 'create'] as const,
  delete: () => ['queues', 'delete'] as const,
  alter: () => ['queues', 'alter'] as const,
  get: (projectRef: string | undefined, queueName: string) =>
    ['projects', projectRef, 'queues', queueName] as const,
  list: (projectRef: string | undefined) => ['projects', projectRef, 'queues'] as const,
}
