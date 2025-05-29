import { Message } from 'ai/react'

type MessagePart = NonNullable<Message['parts']>[number]

// Helper function to find result data directly from parts array
export const findResultForManualId = (
  parts: Readonly<MessagePart[]> | undefined,
  manualId: string
): any[] | undefined => {
  if (!parts) return undefined

  const invocationPart = parts.find(
    (part: MessagePart) =>
      part.type === 'tool-invocation' &&
      'toolInvocation' in part &&
      part.toolInvocation.state === 'result' &&
      'result' in part.toolInvocation &&
      part.toolInvocation.result?.manualToolCallId === manualId
  )

  if (
    invocationPart &&
    'toolInvocation' in invocationPart &&
    'result' in invocationPart.toolInvocation &&
    invocationPart.toolInvocation.result?.content?.[0]?.text
  ) {
    try {
      const parsedData = JSON.parse(invocationPart.toolInvocation.result.content[0].text)
      return Array.isArray(parsedData) ? parsedData : undefined
    } catch (error) {
      console.error('Failed to parse tool invocation result data for manualId:', manualId, error)
      return undefined
    }
  }
  return undefined
}
