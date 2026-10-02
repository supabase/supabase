import { getTenantConfig } from '@internal/database'
import { logSchema } from '@internal/monitoring'
import fastifyPlugin from 'fastify-plugin'
import { getConfig } from '../../config'

declare module 'fastify' {
  interface FastifyRequest {
    tracingMode?: string
    serverTimings?: { spanName: string; duration: number }[]
  }
}

const { isMultitenant, tracingEnabled, tracingMode: defaultTracingMode } = getConfig()

export const tracing = fastifyPlugin(
  async function tracingMode(fastify) {
    if (!tracingEnabled) {
      return
    }

    fastify.addHook('onRequest', async (request) => {
      try {
        if (isMultitenant && request.tenantId) {
          const tenantConfig = await getTenantConfig(request.tenantId)
          request.tracingMode = tenantConfig.tracingMode
        } else {
          request.tracingMode = defaultTracingMode
        }

        // Use request.opentelemetry().span to get the root request span,
        // not trace.getActiveSpan() which returns a child hook span.
        const span =
          typeof request.opentelemetry === 'function' ? request.opentelemetry()?.span : undefined
        if (span) {
          if (request.tenantId) {
            span.setAttribute('tenant.ref', request.tenantId)
          }
          if (request.tracingMode) {
            span.setAttribute('trace.mode', request.tracingMode)
          }
        }
      } catch (e) {
        logSchema.error(request.log, 'failed setting tracing mode', {
          error: e,
          type: 'tracing',
          tenantId: request.tenantId,
          project: request.tenantId,
          reqId: request.id,
          sbReqId: request.sbReqId,
        })
      }
    })
  },
  { name: 'tracing-mode' }
)
