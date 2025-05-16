import { MessagePart } from '@ai-sdk/react' // Keep type if needed

// Helper function to find result data directly from parts array
export const findResultForManualId = (
  parts: Readonly<MessagePart[]> | undefined,
  manualId: string
): any[] | undefined => {
  if (!parts) return undefined

  const invocationPart = parts.find(
    (part: MessagePart) =>
      part.type === 'tool-invocation' &&
      part.toolInvocation.state === 'result' &&
      part.toolInvocation.result?.manualToolCallId === manualId
  )

  if (invocationPart?.toolInvocation.result?.content?.[0]?.text) {
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
