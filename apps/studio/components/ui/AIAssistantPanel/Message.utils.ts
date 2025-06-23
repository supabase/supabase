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

// [Joshen] From https://github.com/remarkjs/react-markdown/blob/fda7fa560bec901a6103e195f9b1979dab543b17/lib/index.js#L425
export function defaultUrlTransform(value: string) {
  const safeProtocol = /^(https?|ircs?|mailto|xmpp)$/i
  const colon = value.indexOf(':')
  const questionMark = value.indexOf('?')
  const numberSign = value.indexOf('#')
  const slash = value.indexOf('/')

  if (
    // If there is no protocol, it’s relative.
    colon === -1 ||
    // If the first colon is after a `?`, `#`, or `/`, it’s not a protocol.
    (slash !== -1 && colon > slash) ||
    (questionMark !== -1 && colon > questionMark) ||
    (numberSign !== -1 && colon > numberSign) ||
    // It is a protocol, it should be allowed.
    safeProtocol.test(value.slice(0, colon))
  ) {
    return value
  }

  return ''
}
