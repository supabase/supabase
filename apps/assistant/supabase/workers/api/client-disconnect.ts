import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Abort only when the HTTP client actually drops the connection.
 *
 * Do not listen to IncomingMessage `close`. After the POST body is fully
 * read, Node emits `close` even though the client is still waiting for the
 * SSE response. That would abort `streamText` immediately and the client
 * would only receive `[DONE]`.
 */
export function abortOnClientDisconnect(
  req: IncomingMessage,
  res: ServerResponse,
  abort: AbortController
) {
  const onDisconnect = () => {
    if (!res.writableEnded) abort.abort()
  }

  req.on('aborted', onDisconnect)
  res.on('close', onDisconnect)
}
