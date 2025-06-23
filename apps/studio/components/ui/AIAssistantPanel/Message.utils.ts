import { Message } from 'ai/react'

type MessagePart = NonNullable<Message['parts']>[number]

const extractDataFromSafetyMessage = (text: string): string | null => {
  const openingTags = [...text.matchAll(/<untrusted-data-[a-z0-9-]+>/gi)]
  if (openingTags.length < 2) return null

  const closingTagMatch = text.match(/<\/untrusted-data-[a-z0-9-]+>/i)
  if (!closingTagMatch) return null

  const secondOpeningEnd = openingTags[1].index! + openingTags[1][0].length
  const closingStart = text.indexOf(closingTagMatch[0])
  const content = text.substring(secondOpeningEnd, closingStart)

  return content.replace(/\\n/g, '').replace(/\\"/g, '"').replace(/\n/g, '').trim()
}

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
      const rawText = invocationPart.toolInvocation.result.content[0].text

      const extractedData = extractDataFromSafetyMessage(rawText) || rawText

      let parsedData = JSON.parse(extractedData.trim())
      return Array.isArray(parsedData) ? parsedData : undefined
    } catch (error) {
      console.error('Failed to parse tool invocation result data for manualId:', manualId, error)
      return undefined
    }
  }
  return undefined
}
