import { getXForwardedHostRegExp } from '@internal/http/x-forwarded-host'
import { getConfig } from '../../config'

const {
  version,
  requestTraceHeader,
  isMultitenant,
  tenantId: defaultTenantId,
  region,
  serviceName,
  storageS3InternalTracesEnabled,
} = getConfig()

const xForwardedHostRegExp = getXForwardedHostRegExp()

import { FastifyOtelInstrumentation } from '@fastify/otel'
import { logger, logSchema } from '@internal/monitoring/logger'
import { TenantSpanProcessor } from '@internal/monitoring/otel-instrumentation'
import { trace } from '@opentelemetry/api'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor, SpanExporter, SpanProcessor } from '@opentelemetry/sdk-trace-base'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

const tracingEnabled = process.env.TRACING_ENABLED === 'true'

const endpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
let traceExporter: SpanExporter | undefined = undefined
let tracingSdk: NodeSDK | undefined
let tracingShutdownPromise: Promise<void> | undefined
let unregisterTracingInstrumentations: (() => void) | undefined
let unregisterClassInstrumentations: (() => void) | undefined
let classInstrumentationsImportPromise: Promise<void> | undefined
let tracingShutdownRequested = false

interface OTelTracingGlobalState {
  __otelTracingShutdown?: () => Promise<void>
}

function unregisterTracingInstrumentation(
  unregister: (() => void) | undefined,
  name: 'class' | 'tracing'
) {
  if (!unregister) {
    return
  }

  try {
    unregister()
  } catch (error) {
    logSchema.error(logger, `[Otel] Failed to unregister ${name} instrumentations`, {
      type: 'otel',
      error,
    })
  }
}

if (tracingEnabled && endpoint) {
  // Create an OTLP trace exporter
  traceExporter = new OTLPTraceExporter({
    url: endpoint,
    compression: process.env.OTEL_EXPORTER_OTLP_COMPRESSION as CompressionAlgorithm,
  })
}

const spanProcessors: SpanProcessor[] = []

if (tracingEnabled && traceExporter) {
  spanProcessors.push(new TenantSpanProcessor())
  spanProcessors.push(new BatchSpanProcessor(traceExporter))
} else if (tracingEnabled) {
  logSchema.warning(
    logger,
    '[Otel] TRACING_ENABLED=true but no OTLP trace endpoint configured; skipping tracing SDK startup',
    {
      type: 'otel',
    }
  )
}

if (tracingEnabled && traceExporter && spanProcessors.length > 0) {
  // Configure the OpenTelemetry Node SDK
  tracingSdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: version,
    }),
    spanProcessors,
    metricReaders: [],
  })

  // Initialize the OpenTelemetry Node SDK
  tracingSdk.start()
  tracingShutdownRequested = false

  const ignoreRoutes = ['/metrics', '/status', '/health', '/healthcheck']
  const tracingInstrumentations = [
    // @fastify/otel replaces @opentelemetry/instrumentation-fastify
    // It auto-sets http.route, http.request.method, url.path on spans.
    // Other attributes (tenant.ref, trace.mode, http.operation) are set
    // in Fastify hooks via request.opentelemetry().span.
    new FastifyOtelInstrumentation({
      enabled: true,
      registerOnInitialization: true,
      ignorePaths: (routeOpts) => {
        return ignoreRoutes.includes(routeOpts.url)
      },
    }),
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        ignoreIncomingRequestHook: (req) => {
          return ignoreRoutes.some((url) => req.url?.includes(url)) ?? false
        },
        ignoreOutgoingRequestHook: (req) => {
          // Skip OTEL instrumentation for S3 Tables requests to avoid injecting
          // unsupported headers (baggage, traceparent, tracestate)
          const host = req.hostname || req.host || ''
          return host.includes('.s3tables.') || host.includes('--table-s3')
        },
        startIncomingSpanHook: (req) => {
          let tenantId = ''
          if (isMultitenant) {
            if (xForwardedHostRegExp) {
              const serverRequest = req
              const xForwardedHost = serverRequest.headers['x-forwarded-host']
              if (typeof xForwardedHost !== 'string') return {}
              const result = xForwardedHost.match(xForwardedHostRegExp)
              if (!result) return {}
              tenantId = result[1]
            }
          } else {
            tenantId = defaultTenantId
          }

          return {
            'tenant.ref': tenantId,
            region,
          }
        },
        headersToSpanAttributes: {
          client: {
            requestHeaders: requestTraceHeader ? [requestTraceHeader] : [],
          },
          server: {
            requestHeaders: requestTraceHeader ? [requestTraceHeader] : [],
          },
        },
      },
      '@opentelemetry/instrumentation-fs': {
        enabled: false,
      },
      '@opentelemetry/instrumentation-aws-sdk': {
        enabled: storageS3InternalTracesEnabled,
      },
      '@opentelemetry/instrumentation-pg': {
        enabled: true,
        requireParentSpan: true,
      },
      '@opentelemetry/instrumentation-runtime-node': {
        enabled: false,
      },
    }),
  ]

  unregisterTracingInstrumentations = registerInstrumentations({
    tracerProvider: trace.getTracerProvider(),
    instrumentations: tracingInstrumentations,
  })

  const sdk = tracingSdk

  // Load class instrumentations after SDK starts to avoid loading http/metrics.ts too early
  classInstrumentationsImportPromise = import('./otel-class-instrumentations')
    .then(({ loadClassInstrumentations }) => loadClassInstrumentations())
    .then((classInstrumentations) => {
      if (tracingShutdownRequested || tracingSdk !== sdk) {
        return
      }

      unregisterClassInstrumentations = registerInstrumentations({
        tracerProvider: trace.getTracerProvider(),
        instrumentations: classInstrumentations,
      })
    })
    .catch((error) => {
      logSchema.error(logger, '[Otel] Failed to load class instrumentations', {
        type: 'otel',
        error,
      })
    })

  const shutdownOtelTracing = async () => {
    if (tracingShutdownPromise) {
      await tracingShutdownPromise
      return
    }

    const sdk = tracingSdk
    if (!sdk) {
      return
    }

    tracingShutdownRequested = true

    tracingShutdownPromise = (async () => {
      logSchema.info(logger, '[Otel] Stopping', {
        type: 'otel',
      })

      try {
        await classInstrumentationsImportPromise
        classInstrumentationsImportPromise = undefined

        unregisterTracingInstrumentation(unregisterClassInstrumentations, 'class')
        unregisterClassInstrumentations = undefined
        unregisterTracingInstrumentation(unregisterTracingInstrumentations, 'tracing')
        unregisterTracingInstrumentations = undefined

        await sdk.shutdown()

        logSchema.info(logger, '[Otel] Exited', {
          type: 'otel',
        })
      } catch (error) {
        logSchema.error(logger, '[Otel] Shutdown error', {
          type: 'otel',
          error,
        })
      } finally {
        if (tracingSdk === sdk) {
          tracingSdk = undefined
        }
        tracingShutdownRequested = false
        classInstrumentationsImportPromise = undefined
        tracingShutdownPromise = undefined
      }
    })()

    await tracingShutdownPromise
  }

  ;(globalThis as typeof globalThis & OTelTracingGlobalState).__otelTracingShutdown =
    shutdownOtelTracing

  // Gracefully shutdown the SDK on process exit
  process.once('SIGTERM', () => {
    void shutdownOtelTracing()
  })
}
