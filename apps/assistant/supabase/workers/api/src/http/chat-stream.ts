import {
  consumeStream,
  createUIMessageStreamResponse,
  generateId,
  toUIMessageStream,
  type UIMessage,
} from 'ai'

export type StreamResult = {
  stream: Parameters<typeof toUIMessageStream>[0]['stream']
}

function streamErrorMessage(error: unknown): string {
  if (error == null) return 'unknown error'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return JSON.stringify(error)
}

/**
 * Build the UI message SSE response using AI SDK 7's stateless helpers.
 *
 * `result.toUIMessageStreamResponse()` is deprecated. Pass `result.stream`
 * into `toUIMessageStream`, then wrap with `createUIMessageStreamResponse`.
 * `consumeSseStream: consumeStream` tees the SSE body so `onFinish` still
 * runs if the client disconnects — do not call `result.consumeStream()`,
 * which drains the same model stream the UI converter needs.
 */
export async function toChatResponse(
  result: StreamResult,
  options: {
    originalMessages: UIMessage[]
    onFinish: (event: { messages: UIMessage[]; responseMessage: UIMessage }) => void | Promise<void>
  }
): Promise<Response> {
  return createUIMessageStreamResponse({
    headers: { 'Content-Encoding': 'none' },
    consumeSseStream: consumeStream,
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: options.originalMessages,
      generateMessageId: generateId,
      sendReasoning: true,
      onFinish: options.onFinish,
      onError: streamErrorMessage,
    }),
  })
}
