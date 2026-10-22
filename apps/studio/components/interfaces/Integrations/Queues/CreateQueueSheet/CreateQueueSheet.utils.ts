export function createdQueuePath(projectRef: string, queueName: string) {
  return `/project/${projectRef}/integrations/queues/queues/${encodeURIComponent(queueName)}`
}
