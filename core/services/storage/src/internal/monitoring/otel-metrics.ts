import { logger, logSchema } from '@internal/monitoring/logger'
import { StorageNodeInstrumentation } from '@internal/monitoring/system'
import { metrics } from '@opentelemetry/api'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { HostMetrics } from '@opentelemetry/host-metrics'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node'
import { CompressionAlgorithm } from '@opentelemetry/otlp-exporter-base'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  AggregationTemporality,
  AggregationType,
  MeterProvider,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'
import { FastifyReply, FastifyRequest } from 'fastify'
import { getConfig } from '../../config'
import { HTTP_SIZE_METRICS_AGGREGATION_CARDINALITY_LIMIT } from './metric-limits'
import { isOtelMetricsReaderEnabled } from './otel-metrics-config'
import { resolveRuntimeIdentity } from './runtime-identity'

const config = getConfig()
const {
  version,
  otelMetricsExportIntervalMs,
  otelMetricsEnabled,
  otlpMetricsEndpoint,
  otelMetricsTemporality,
  prometheusMetricsEnabled,
  region,
  serviceName,
} = config
const metricsReaderEnabled = isOtelMetricsReaderEnabled(config)

let prometheusExporter: PrometheusExporter | undefined
let meterProvider: MeterProvider | undefined
let metricsShutdownPromise: Promise<void> | undefined
let unregisterMetricInstrumentations: (() => void) | undefined

interface OTelMetricsGlobalState {
  __otelMetricsShutdown?: () => Promise<void>
}

const SERVICE_INSTANCE_ID_ATTRIBUTE = 'service.instance.id'
const PROCESS_PID_ATTRIBUTE = 'process.pid'
const WORKER_ID_ATTRIBUTE = 'worker.id'
const PLATFORMATIC_APPLICATION_ID_ATTRIBUTE = 'platformatic.application.id'

function unregisterMetricInstrumentation(unregister: (() => void) | undefined) {
  if (!unregister) {
    return
  }

  try {
    unregister()
  } catch (error) {
    logSchema.error(logger, '[OTel Metrics] Failed to unregister metric instrumentations', {
      type: 'otel-metrics',
      error,
    })
  }
}

// =============================================================================
// Shared config
// =============================================================================
const metricIdentity = resolveRuntimeIdentity()
const instance = metricIdentity.hostname

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: version,
  'metric.version': '1',
  region,
  instance,
  [SERVICE_INSTANCE_ID_ATTRIBUTE]: metricIdentity.serviceInstanceId,
  [PROCESS_PID_ATTRIBUTE]: process.pid,
  ...(metricIdentity.workerId ? { [WORKER_ID_ATTRIBUTE]: metricIdentity.workerId } : {}),
  ...(metricIdentity.applicationId
    ? { [PLATFORMATIC_APPLICATION_ID_ATTRIBUTE]: metricIdentity.applicationId }
    : {}),
})

// Bucket boundaries for duration histograms (in seconds)
const durationBuckets = [
  0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
]

const histogramAggregation = {
  type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
  options: { boundaries: durationBuckets },
} as const

// GC pauses span sub-millisecond incremental slices to multi-second major
// collections, so the default 4-boundary [10ms, 100ms, 1s, 10s] histogram is
// too coarse to distinguish incremental/minor GC and lacks resolution above 1s.
const gcDurationBuckets = [0.0001, 0.00025, ...durationBuckets, 30]

const gcHistogramAggregation = {
  type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
  options: { boundaries: gcDurationBuckets },
} as const

const dropAggregation = { type: AggregationType.DROP } as const

// Views — custom histogram buckets + drop auto-instrumentation duplicates.
const views = [
  {
    meterName: 'storage-api',
    instrumentName: 'http_request_duration_seconds',
    aggregation: histogramAggregation,
    aggregationCardinalityLimit: HTTP_SIZE_METRICS_AGGREGATION_CARDINALITY_LIMIT,
  },
  {
    meterName: 'storage-api',
    instrumentName: 'http_request_size_bytes',
    aggregationCardinalityLimit: HTTP_SIZE_METRICS_AGGREGATION_CARDINALITY_LIMIT,
  },
  {
    meterName: 'storage-api',
    instrumentName: 'http_response_size_bytes',
    aggregationCardinalityLimit: HTTP_SIZE_METRICS_AGGREGATION_CARDINALITY_LIMIT,
  },
  {
    meterName: 'storage-api',
    instrumentName: 'database_query_performance_seconds',
    aggregation: histogramAggregation,
  },
  {
    meterName: 'storage-api',
    instrumentName: 'db_connection_acquire_seconds',
    aggregation: histogramAggregation,
  },
  {
    meterName: 'storage-api',
    instrumentName: 'queue_job_scheduled_time_seconds',
    aggregation: histogramAggregation,
  },
  {
    meterName: 'storage-api',
    instrumentName: 's3_upload_part_seconds',
    aggregation: histogramAggregation,
  },
  // Override the RuntimeNodeInstrumentation default GC buckets ([10ms, 100ms,
  // 1s, 10s]) with sub-ms boundaries so incremental/minor pauses are visible.
  {
    meterName: '@opentelemetry/instrumentation-runtime-node',
    instrumentName: 'v8js.gc.duration',
    aggregation: gcHistogramAggregation,
  },
  // Drop duplicate HTTP metrics from auto-instrumentations — we have our own in metrics.ts
  {
    meterName: '@opentelemetry/instrumentation-http',
    instrumentName: '*',
    aggregation: dropAggregation,
  },
  // Drop any Fastify metrics from auto-instrumentations (now using @fastify/otel for traces only)
  {
    meterName: '@fastify/otel',
    instrumentName: '*',
    aggregation: dropAggregation,
  },
]

// =============================================================================
// Shutdown
// =============================================================================
export async function shutdownOtelMetrics(): Promise<void> {
  if (metricsShutdownPromise) {
    await metricsShutdownPromise
    return
  }

  if (!meterProvider) {
    return
  }

  const provider = meterProvider
  metricsShutdownPromise = (async () => {
    logSchema.info(logger, '[OTel Metrics] Stopping', {
      type: 'otel-metrics',
    })

    const unregister = unregisterMetricInstrumentations
    unregisterMetricInstrumentations = undefined
    unregisterMetricInstrumentation(unregister)

    try {
      await provider.shutdown()
      logSchema.info(logger, '[OTel Metrics] Shutdown complete', {
        type: 'otel-metrics',
      })
    } catch (error) {
      logSchema.error(logger, '[OTel Metrics] Shutdown error', {
        type: 'otel-metrics',
        error,
      })
    } finally {
      if (meterProvider === provider) {
        meterProvider = undefined
      }
      prometheusExporter = undefined
      metricsShutdownPromise = undefined
    }
  })()

  await metricsShutdownPromise
}

;(globalThis as typeof globalThis & OTelMetricsGlobalState).__otelMetricsShutdown =
  shutdownOtelMetrics

// =============================================================================
// /metrics endpoint handler
// =============================================================================
export async function handleMetricsRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!prometheusExporter) {
    reply.status(404).send('Metrics not enabled')
    return
  }

  const req = request.raw
  const res = reply.raw

  reply.hijack()
  prometheusExporter.getMetricsRequestHandler(req, res)

  return Promise.resolve()
}

// =============================================================================
// Initialize at import time
// =============================================================================
if (otelMetricsEnabled) {
  const readers = []

  if (metricsReaderEnabled) {
    if (otlpMetricsEndpoint) {
      const otlpExporter = new OTLPMetricExporter({
        url: otlpMetricsEndpoint,
        compression: process.env.OTEL_EXPORTER_OTLP_COMPRESSION as CompressionAlgorithm,
        temporalityPreference:
          otelMetricsTemporality === 'DELTA'
            ? AggregationTemporality.DELTA
            : AggregationTemporality.CUMULATIVE,
      })

      readers.push(
        new PeriodicExportingMetricReader({
          exporter: otlpExporter,
          exportIntervalMillis: otelMetricsExportIntervalMs,
        })
      )
    }

    if (prometheusMetricsEnabled) {
      prometheusExporter = new PrometheusExporter({
        prefix: serviceName,
        preventServerStart: true,
        withResourceConstantLabels:
          /^(region|instance|metric\.version|service\.name|service\.instance\.id|worker\.id|platformatic\.application\.id)$/,
      })
      readers.push(prometheusExporter)
    }
  }

  meterProvider = new MeterProvider({
    resource,
    readers,
    views,
  })

  // Register as global provider IMMEDIATELY so metrics.ts instruments work
  metrics.setGlobalMeterProvider(meterProvider)

  logger.info(
    {
      type: 'otel-metrics',
      otlpEndpoint: otlpMetricsEndpoint,
      exportIntervalMs: otelMetricsExportIntervalMs,
    },
    '[OTel Metrics] Initializing'
  )

  if (otlpMetricsEndpoint) {
    logSchema.info(logger, '[OTel Metrics] OTLP exporter configured', {
      type: 'otel-metrics',
    })
  }

  // Initialize host metrics for Node.js runtime metrics
  const hostMetrics = new HostMetrics({
    meterProvider,
    name: 'storage-api-host-metrics',
    metricGroups: ['process.cpu', 'process.memory'],
  })
  hostMetrics.start()

  // Register Node.js runtime instrumentations
  unregisterMetricInstrumentations = registerInstrumentations({
    meterProvider,
    instrumentations: [
      new RuntimeNodeInstrumentation(),
      new StorageNodeInstrumentation({ labels: { region, instance } }),
    ],
  })

  logSchema.info(logger, '[OTel Metrics] Initialized', { type: 'otel-metrics' })

  // Graceful shutdown
  const shutdown = () => {
    void shutdownOtelMetrics()
  }

  process.once('SIGTERM', shutdown)
  process.once('SIGINT', shutdown)
}
