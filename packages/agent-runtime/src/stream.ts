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

export type AgentStreamStatus = 'completed' | 'failed' | 'cancelled'

/**
 * Build the UI message SSE response using AI SDK 7's stateless helpers.
 *
 * `result.toUIMessageStreamResponse()` is deprecated. Pass `result.stream`
 * into `toUIMessageStream`, then wrap with `createUIMessageStreamResponse`.
 * `consumeSseStream: consumeStream` tees the SSE body so `onFinish` still
 * runs if the client disconnects — do not call `result.consumeStream()`,
 * which drains the same model stream the UI converter needs.
 */
export async function createAgentStreamResponse(
  result: StreamResult,
  options: {
    headers?: HeadersInit
    onError?: (error: unknown) => string
    onSettled?: (event: { status: AgentStreamStatus }) => Promise<void>
    originalMessages: UIMessage[]
    onFinish: (event: {
      messages: UIMessage[]
      responseMessage: UIMessage
      status: AgentStreamStatus
    }) => void | Promise<void>
  }
): Promise<Response> {
  let status: AgentStreamStatus = 'failed'
  let errored = false
  let settled: Promise<void> | undefined
  const settle = () => (settled ??= Promise.resolve().then(() => options.onSettled?.({ status })))
  const stream = toUIMessageStream({
    stream: result.stream.pipeThrough(
      new TransformStream({
        transform(part, controller) {
          // The UI formatter also handles recoverable tool errors. Only a model
          // stream error makes the entire run fail; a tool may fail and recover.
          if (part.type === 'error') errored = true
          controller.enqueue(part)
        },
      })
    ),
    originalMessages: options.originalMessages,
    generateMessageId: generateId,
    sendReasoning: true,
    onFinish: async (event) => {
      status = event.isAborted
        ? 'cancelled'
        : errored || !event.finishReason || event.finishReason === 'error'
          ? 'failed'
          : 'completed'
      try {
        await options.onFinish({ ...event, status })
      } catch (error) {
        status = 'failed'
        throw error
      }
    },
    onError: (error) => {
      return options.onError?.(error) ?? 'Unable to generate a response. Try again.'
    },
  })
  const reader = stream.getReader()
  const completed = new ReadableStream({
    async pull(controller) {
      try {
        const chunk = await reader.read()
        if (chunk.done) {
          await settle()
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
          await settle()
          tail.forEach((part) => controller.enqueue(part))
          controller.close()
        } else controller.enqueue(chunk.value)
      } catch (error) {
        try {
          status = 'failed'
          await settle()
        } finally {
          controller.error(error)
        }
      }
    },
    async cancel(reason) {
      status = 'cancelled'
      try {
        await reader.cancel(reason)
      } finally {
        await settle()
      }
    },
  })
  const headers = new Headers(options.headers)
  headers.set('Content-Encoding', 'none')
  return createUIMessageStreamResponse({
    headers,
    consumeSseStream: consumeStream,
    stream: completed,
  })
}
