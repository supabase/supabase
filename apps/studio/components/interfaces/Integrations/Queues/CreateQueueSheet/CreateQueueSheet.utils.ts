export function createdQueuePath(projectRef: string, queueName: string) {
  return `/project/${projectRef}/integrations/queues/queues/${encodeURIComponent(queueName)}`
}

/**
 * Dismissal updates history asynchronously. Navigate only after it settles,
 * so the queue page is not stacked on top of `?new=true`.
 */
export async function navigateToCreatedQueue({
  dismissPanel,
  navigate,
  projectRef,
  queueName,
}: {
  dismissPanel: () => void | Promise<unknown>
  navigate: (path: string) => void | Promise<unknown>
  projectRef: string
  queueName: string
}) {
  await dismissPanel()
  await navigate(createdQueuePath(projectRef, queueName))
}
