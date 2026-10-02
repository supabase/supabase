import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Http2ServerResponse } from 'node:http2'
import type { Socket } from 'node:net'
import { StorageBackendError } from '@internal/errors'
import fastifyPlugin from 'fastify-plugin'

// Register once at the app root so child error handlers and direct replies share the hook.
export const closeConnectionOnError = fastifyPlugin(
  async function (fastify) {
    fastify.addHook('onRequest', (request, reply, done) => {
      // The parser can still dispatch requests from its current read after close is selected.
      if (closingSockets.has(request.raw.socket)) {
        reply.hijack()
        return
      }
      done()
    })

    fastify.addHook('onSend', (request, reply, payload, done) => {
      if (reply.statusCode >= 400) {
        closeConnectionAfterResponse(request.raw, reply.raw, request.executionError)
      }
      done(null, payload)
    })
  },
  { name: 'close-connection-on-error' }
)

const noop = () => {}

const closingSockets = new WeakSet<Socket>()

// Called before headers are written by Fastify's onSend or the TUS writeHead wrapper.
// Close after the response so an unread body cannot stall a pooled connection.
export function closeConnectionAfterResponse(
  request: IncomingMessage,
  response: ServerResponse | Http2ServerResponse,
  error?: unknown
) {
  const unreadDeclaredBody =
    (request.headers['transfer-encoding'] !== undefined ||
      Number(request.headers['content-length']) > 0) &&
    !request.complete
  const explicitClose = error instanceof StorageBackendError && error.shouldCloseConnection()
  if (!unreadDeclaredBody && !explicitClose) return

  const socket = response.socket ?? request.socket
  if (socket.destroyed || closingSockets.has(socket)) return
  closingSockets.add(socket)

  response.setHeader('Connection', 'close')
  // With Connection: close Node destroys the socket as soon as
  // the response is flushed. A client still sending its body then
  // gets a TCP reset that can discard the response before it is read.
  // Instead half-close and keep draining until the client closes or
  // the timer fires.
  socket.destroySoon = () => socket.end()

  let timer: NodeJS.Timeout | undefined
  const cleanup = () => {
    clearTimeout(timer)
    response.off('finish', endConnection)
  }
  const endConnection = () => {
    if (socket.destroyed) return
    timer = setTimeout(() => {
      socket.off('close', cleanup)
      socket.destroy()
    }, 3000).unref()
    socket.end()
    socket.prependListener('end', () => socket.destroy())
    // backpressure: let queued socket resume run before detaching its parser listeners.
    process.nextTick(() => {
      if (socket.destroyed) return
      socket.removeAllListeners('data')
      socket.on('data', noop)
      if (socket.readable) socket.resume()
    })
  }

  socket.once('close', cleanup)
  response.once('finish', endConnection)
}
