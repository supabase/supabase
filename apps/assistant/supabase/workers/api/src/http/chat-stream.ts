import { createAgentStreamResponse } from '@supabase/agent-runtime'
import { McpConnectionError } from '@supabase/agent-runtime/mcp'

function streamErrorMessage(error: unknown): string {
  if (error instanceof McpConnectionError && error.code === 'authorization_required') {
    return JSON.stringify({
      code: 'oauth_required',
      message: 'Reconnect this organization to continue.',
    })
  }
  if (error == null) return 'unknown error'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return JSON.stringify(error)
}

/** Studio's revision header is an integration concern, separate from the agent stream. */
export function toChatResponse(
  result: Parameters<typeof createAgentStreamResponse>[0],
  options: Omit<Parameters<typeof createAgentStreamResponse>[1], 'headers' | 'onError'> & {
    revision?: number
  }
): Promise<Response> {
  const { revision, ...lifecycle } = options
  const stream = result.stream.pipeThrough(
    new TransformStream({
      transform(part, controller) {
        if (
          part.type === 'tool-error' &&
          part.error instanceof McpConnectionError &&
          part.error.code === 'authorization_required'
        ) {
          // Studio recognizes oauth_required in the global chat error. Stop this
          // turn so it can reconnect instead of treating lost access as a tool result.
          controller.enqueue({ type: 'error', error: part.error })
          controller.terminate()
          return
        }
        controller.enqueue(part)
      },
    })
  )
  return createAgentStreamResponse(
    { stream },
    {
      ...lifecycle,
      onError: streamErrorMessage,
      headers: revision === undefined ? undefined : { 'x-assistant-revision': String(revision) },
    }
  )
}
