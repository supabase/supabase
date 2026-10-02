import { logSchema } from '@internal/monitoring/logger'
import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

export const blobResponse = fastifyPlugin(
  async function blobResponse(fastify: FastifyInstance) {
    fastify.addHook('onSend', (request, reply, payload, done) => {
      if (typeof Blob !== 'undefined' && payload instanceof Blob) {
        done(null, payload.stream())
        return
      }

      if (!isSupportedFastifyPayload(payload)) {
        logSchema.error(request.log, 'Unsupported Fastify reply payload', {
          type: 'fastify',
          metadata: JSON.stringify({
            method: request.method,
            route: request.routeOptions.url,
            url: request.url.split('?', 1)[0],
            statusCode: reply.statusCode,
            contentType: reply.getHeader('content-type'),
            payloadType: typeof payload,
            ...describePayload(payload),
          }),
        })
      }

      done(null, payload)
    })
  },
  { name: 'blob-response' }
)

function isSupportedFastifyPayload(payload: unknown) {
  if (
    payload === null ||
    payload === undefined ||
    typeof payload === 'string' ||
    Buffer.isBuffer(payload)
  ) {
    return true
  }

  try {
    const stream = payload as { getReader?: unknown; pipe?: unknown }
    return (
      typeof stream.pipe === 'function' ||
      typeof stream.getReader === 'function' ||
      Object.prototype.toString.call(payload) === '[object Response]'
    )
  } catch {
    return false
  }
}

function describePayload(payload: unknown) {
  try {
    return {
      payloadConstructor:
        typeof payload === 'object' && payload !== null ? payload.constructor?.name : undefined,
      payloadTag: Object.prototype.toString.call(payload),
    }
  } catch {
    return { payloadTag: '[uninspectable]' }
  }
}
