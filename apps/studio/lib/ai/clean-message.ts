import type { UIMessage } from 'ai'

/**
 * Cleans a UIMessage by removing streaming-only parts before persisting to database.
 *
 * Only removes:
 * - step-start/step-finish parts (streaming boundary markers only useful during streaming)
 * - tool parts in input-streaming state (incomplete - still being typed)
 *
 * Keeps all other parts including tool parts with their full context.
 */
export function cleanMessage(msg: UIMessage): UIMessage {
  const cleanedParts = msg.parts.filter((part) => {
    // Drop step-start/step-finish (streaming boundaries only)
    if (part.type === 'step-start' || (part as { type: string }).type === 'step-finish') return false

    // For tool parts, only drop if still in input-streaming state
    if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
      if ((part as any).state === 'input-streaming') return false
    }

    // Keep everything else (text, reasoning, complete tool parts, etc.)
    return true
  })

  return {
    id: msg.id,
    role: msg.role,
    parts: cleanedParts,
    ...(msg.metadata != null && typeof msg.metadata === 'object' ? { metadata: msg.metadata } : {}),
  }
}

/**
 * Cleans an array of UIMessages.
 */
export function cleanMessages(messages: UIMessage[]): UIMessage[] {
  return messages.map(cleanMessage)
}
