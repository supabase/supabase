import type { UIMessage } from 'ai'

/**
 * Prepares messages for API transmission by cleaning and limiting history
 */
export function prepareMessagesForAPI(messages: UIMessage[]): UIMessage[] {
  // [Joshen] Specifically limiting the chat history that get's sent to reduce the
  // size of the context that goes into the model. This should always be an odd number
  // as much as possible so that the first message is always the user's
  const MAX_CHAT_HISTORY = 7

  const slicedMessages = messages.slice(-MAX_CHAT_HISTORY)

  // Filter out results from messages before sending to the model
  const cleanedMessages = slicedMessages.map((_message) => {
    const message = _message as UIMessage & { results?: unknown }
    const cleanedMessage = { ...message } as UIMessage & { results?: unknown }
    if (message.role === 'assistant' && message.results) {
      delete cleanedMessage.results
    }
    return cleanedMessage as UIMessage
  })

  return cleanedMessages
}
