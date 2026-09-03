import type { UIMessage } from 'ai'

/** Last write wins. Postgres `ON CONFLICT DO UPDATE` cannot touch the same key twice. */
export function dedupeMessagesById(messages: UIMessage[]): UIMessage[] {
  const byId = new Map<string, UIMessage>()
  for (const message of messages) {
    byId.set(message.id, message)
  }
  return [...byId.values()]
}

/**
 * Incoming history is already upserted before the model runs. Persist the model
 * reply (including continuations that reuse an existing assistant id) and any
 * messages the SDK added that were not in the pre-stream snapshot.
 */
export function messagesToPersistAfterChat({
  originalIds,
  messages,
  responseMessage,
}: {
  originalIds: Set<string>
  messages: UIMessage[]
  responseMessage: UIMessage
}): UIMessage[] {
  const toStore: UIMessage[] = []
  for (const message of messages) {
    if (!originalIds.has(message.id)) toStore.push(message)
  }
  toStore.push(responseMessage)
  return dedupeMessagesById(toStore)
}
