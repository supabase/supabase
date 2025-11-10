/**
 * Queue names should only contain alphanumeric characters, underscores, and hyphens
 * @throws {Error} If queue name contains invalid characters
 */
export const validateQueueName = (queueName: string): void => {
  if (!/^[a-zA-Z0-9_-]+$/.test(queueName)) {
    throw new Error(
      'Invalid queue name: must contain only alphanumeric characters, underscores, and hyphens'
    )
  }
}
