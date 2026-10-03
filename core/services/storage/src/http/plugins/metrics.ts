import { recordHttpRequestMetrics } from '@internal/monitoring/metrics'
import { handleMetricsRequest } from '@internal/monitoring/otel-metrics'
import fastifyPlugin from 'fastify-plugin'
import { getConfig } from '../../config'

const { prometheusMetricsEnabled } = getConfig()

function parseMetricSizeHeader(value: number | string | string[] | undefined): number | undefined {
  let size: number | undefined

  if (typeof value === 'number') {
    size = value
  } else if (typeof value === 'string') {
    size = parseInt(value, 10)
  }

  return typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : undefined
}

interface MetricsOptions {
  enabledEndpoint?: boolean
  excludeRoutes?: Set<string>
}

export const metrics = (options: MetricsOptions = {}) =>
  fastifyPlugin(async (fastify) => {
    // Register HTTP metrics plugin
    fastify.register(httpMetrics(options))

    // Register metrics endpoint if enabled
    if (prometheusMetricsEnabled) {
      fastify.register(metricsEndpoint(options))
    }
  })

export const metricsEndpoint = ({ enabledEndpoint }: MetricsOptions) => {
  // Metrics endpoint plugin
  return fastifyPlugin(
    async (fastify) => {
      if (enabledEndpoint) {
        fastify.get('/metrics', handleMetricsRequest)
      }
    },
    { name: 'otel-metrics' }
  )
}

interface HttpMetricsOptions {
  /** Routes to exclude from metrics collection */
  excludeRoutes?: Set<string>
}

/**
 * Fastify plugin for collecting HTTP request metrics.
 * Records request duration (histogram) and request count (counter)
 * using OpenTelemetry with tenant support.
 */
export const httpMetrics = (options: HttpMetricsOptions = {}) =>
  fastifyPlugin(
    async (fastify) => {
      const excludeRoutes = options.excludeRoutes?.size
        ? options.excludeRoutes
        : new Set(['/metrics', '/status', '/health', '/healthcheck'])
      const excludePrefixes = Array.from(excludeRoutes, (route) => route + '/')

      // Hook into request lifecycle to measure duration
      fastify.addHook('onRequest', (request, _reply, done) => {
        // Store start time on request for later use
        request.metricsStartTime = performance.now()
        done()
      })

      fastify.addHook('onResponse', (request, reply, done) => {
        const route = request.routeOptions?.url || 'unknown'

        // Skip excluded routes (exact match or subpath)
        if (excludeRoutes.has(route)) {
          done()
          return
        }
        for (let i = 0; i < excludePrefixes.length; i++) {
          if (route.startsWith(excludePrefixes[i])) {
            done()
            return
          }
        }

        const startTime = request.metricsStartTime
        if (startTime === undefined) {
          done()
          return
        }

        // Calculate duration in seconds
        const durationSeconds = (performance.now() - startTime) / 1000

        const operation = request.operation || request.routeOptions?.config?.operation || 'unknown'

        // Record request size from content-length header
        const requestContentLength = request.headers['content-length']
        const requestSize = parseMetricSizeHeader(requestContentLength)

        // Record response size from content-length header
        const responseContentLength = reply.getHeader('content-length')
        const responseSize = parseMetricSizeHeader(responseContentLength)

        recordHttpRequestMetrics(
          durationSeconds,
          requestSize,
          responseSize,
          request.method,
          operation,
          reply.statusCode
        )
        done()
      })
    },
    { name: 'http-metrics' }
  )

// Extend FastifyRequest to include metricsStartTime
declare module 'fastify' {
  interface FastifyRequest {
    metricsStartTime?: number
  }
}
