import {
  consumeStream,
  createUIMessageStreamResponse,
  generateId,
  toUIMessageStream,
  type UIMessage,
  type UIMessageChunk,
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
    revision?: number
    onSettled?: () => Promise<void>
    originalMessages: UIMessage[]
    onFinish: (event: { messages: UIMessage[]; responseMessage: UIMessage }) => void | Promise<void>
  }
): Promise<Response> {
  const stream = toUIMessageStream({
    stream: result.stream,
    originalMessages: options.originalMessages,
    generateMessageId: generateId,
    sendReasoning: true,
    onFinish: options.onFinish,
    onError: streamErrorMessage,
  })
  const reader = stream.getReader()
  const completed = new ReadableStream({
    async pull(controller) {
      try {
        const chunk = await reader.read()
        if (chunk.done) {
          await options.onSettled?.()
          controller.close()
        } else if (chunk.value.type === 'finish') {
          // Commit the canonical response before the browser can submit an approval
          // continuation or a metadata update in reaction to the finish event.
          const tail: UIMessageChunk[] = [chunk.value]
          while (true) {
            const next = await reader.read()
            if (next.done) break
            tail.push(next.value)
          }
          await options.onSettled?.()
          tail.forEach((part) => controller.enqueue(part))
          controller.close()
        } else controller.enqueue(chunk.value)
      } catch (error) {
        try {
          await options.onSettled?.()
        } finally {
          controller.error(error)
        }
      }
    },
    async cancel(reason) {
      try {
        await reader.cancel(reason)
      } finally {
        await options.onSettled?.()
      }
    },
  })
  return createUIMessageStreamResponse({
    headers: {
      'Content-Encoding': 'none',
      ...(options.revision !== undefined
        ? { 'x-assistant-revision': String(options.revision) }
        : {}),
    },
    consumeSseStream: consumeStream,
    stream: completed,
  })
}
