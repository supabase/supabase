interface OTelGlobalState {
  __otelMetricsShutdown?: () => Promise<void>
}

import fs from 'node:fs'
import { vi } from 'vitest'
import { HTTP_SIZE_METRICS_AGGREGATION_CARDINALITY_LIMIT } from './metric-limits'

const mockedMetricsModules = [
  '../../config',
  '@internal/monitoring/logger',
  '@internal/monitoring/system',
  '@opentelemetry/api',
  '@opentelemetry/exporter-metrics-otlp-grpc',
  '@opentelemetry/exporter-prometheus',
  '@opentelemetry/host-metrics',
  '@opentelemetry/instrumentation',
  '@opentelemetry/instrumentation-runtime-node',
  '@opentelemetry/resources',
  '@opentelemetry/sdk-metrics',
  '@platformatic/globals',
  'os',
] as const

async function importOtelMetricsModule() {
  await import('./otel-metrics')
  return (globalThis as typeof globalThis & OTelGlobalState).__otelMetricsShutdown
}

describe('otel metrics', () => {
  const originalOtelMetricsHeaders = process.env.OTEL_EXPORTER_OTLP_METRICS_HEADERS

  afterEach(async () => {
    const otelGlobalState = globalThis as typeof globalThis & OTelGlobalState

    if (otelGlobalState.__otelMetricsShutdown) {
      await otelGlobalState.__otelMetricsShutdown()
      delete otelGlobalState.__otelMetricsShutdown
    }

    if (originalOtelMetricsHeaders === undefined) {
      delete process.env.OTEL_EXPORTER_OTLP_METRICS_HEADERS
    } else {
      process.env.OTEL_EXPORTER_OTLP_METRICS_HEADERS = originalOtelMetricsHeaders
    }

    for (const moduleId of mockedMetricsModules) {
      vi.doUnmock(moduleId)
    }

    vi.restoreAllMocks()
    vi.resetModules()
  })

  test('still shuts down meter provider when unregister throws', async () => {
    process.env.OTEL_EXPORTER_OTLP_METRICS_HEADERS =
      'authorization=Basic dXNlcjpwYXNz==,x-api-key=metrics-token'
    const shutdown = vi.fn().mockResolvedValue(undefined)
    const unregisterError = new Error('metrics unregister failed')
    const unregisterMetricInstrumentations = vi.fn(() => {
      throw unregisterError
    })
    const registerInstrumentations = vi.fn(() => unregisterMetricInstrumentations)
    const HostMetrics = vi.fn(function () {
      return {
        start: vi.fn(),
      }
    })
    const MeterProvider = vi.fn(function () {
      return {
        shutdown,
        getMeter: vi.fn(() => ({})),
      }
    })
    const PrometheusExporter = vi.fn(function () {
      return {
        getMetricsRequestHandler: vi.fn(),
      }
    })
    const OTLPMetricExporter = vi.fn(function (_options: unknown) {
      return {}
    })
    const RuntimeNodeInstrumentation = vi.fn(function () {
      return {}
    })
    const StorageNodeInstrumentation = vi.fn(function () {
      return {}
    })
    const logger = {
      info: vi.fn(),
    }
    const logSchema = {
      error: vi.fn(),
      info: vi.fn(),
    }

    vi.doMock('../../config', () => ({
      getConfig: vi.fn(() => ({
        version: 'test-version',
        otelMetricsExportIntervalMs: 1000,
        otelMetricsEnabled: true,
        otlpMetricsEndpoint: 'http://metrics-collector:4317',
        otelMetricsTemporality: 'CUMULATIVE',
        prometheusMetricsEnabled: true,
        region: 'local',
      })),
    }))
    vi.doMock('@internal/monitoring/logger', () => ({
      logger,
      logSchema,
    }))
    vi.doMock('@internal/monitoring/system', () => ({
      StorageNodeInstrumentation,
    }))
    vi.doMock('@opentelemetry/api', () => ({
      metrics: {
        setGlobalMeterProvider: vi.fn(),
      },
    }))
    vi.doMock('@opentelemetry/exporter-metrics-otlp-grpc', () => ({
      OTLPMetricExporter,
    }))
    vi.doMock('@opentelemetry/exporter-prometheus', () => ({
      PrometheusExporter,
    }))
    vi.doMock('@opentelemetry/host-metrics', () => ({
      HostMetrics,
    }))
    vi.doMock('@opentelemetry/instrumentation', () => ({
      registerInstrumentations,
    }))
    vi.doMock('@opentelemetry/instrumentation-runtime-node', () => ({
      RuntimeNodeInstrumentation,
    }))
    vi.doMock('@opentelemetry/resources', () => ({
      resourceFromAttributes: vi.fn(() => ({})),
    }))
    vi.doMock('@opentelemetry/sdk-metrics', () => ({
      AggregationTemporality: {
        CUMULATIVE: 'CUMULATIVE',
        DELTA: 'DELTA',
      },
      AggregationType: {
        DROP: 'DROP',
        EXPLICIT_BUCKET_HISTOGRAM: 'EXPLICIT_BUCKET_HISTOGRAM',
      },
      MeterProvider,
      PeriodicExportingMetricReader: vi.fn(),
    }))

    const shutdownOtelMetrics = await importOtelMetricsModule()

    await expect(shutdownOtelMetrics?.()).resolves.toBeUndefined()

    expect(unregisterMetricInstrumentations).toHaveBeenCalledTimes(1)
    expect(shutdown).toHaveBeenCalledTimes(1)
    expect(OTLPMetricExporter).toHaveBeenCalledWith(
      expect.objectContaining({ url: 'http://metrics-collector:4317' })
    )
    expect(OTLPMetricExporter.mock.calls[0][0]).not.toHaveProperty('headers')
    expect(OTLPMetricExporter.mock.calls[0][0]).not.toHaveProperty('metadata')
    expect(unregisterMetricInstrumentations.mock.invocationCallOrder[0]).toBeLessThan(
      shutdown.mock.invocationCallOrder[0]
    )
    expect(logSchema.error).toHaveBeenCalledWith(
      logger,
      '[OTel Metrics] Failed to unregister metric instrumentations',
      expect.objectContaining({ type: 'otel-metrics', error: unregisterError })
    )
  })

  test('registers metric views for HTTP size cardinality and runtime GC buckets', async () => {
    const registerInstrumentations = vi.fn(() => vi.fn())
    const HostMetrics = vi.fn(function () {
      return {
        start: vi.fn(),
      }
    })
    const MeterProvider = vi.fn(function () {
      return {
        shutdown: vi.fn().mockResolvedValue(undefined),
        getMeter: vi.fn(() => ({})),
      }
    })
    const PrometheusExporter = vi.fn(function () {
      return {
        getMetricsRequestHandler: vi.fn(),
      }
    })
    const RuntimeNodeInstrumentation = vi.fn(function () {
      return {}
    })
    const StorageNodeInstrumentation = vi.fn(function () {
      return {}
    })

    vi.doMock('../../config', () => ({
      getConfig: vi.fn(() => ({
        version: 'test-version',
        otelMetricsExportIntervalMs: 1000,
        otelMetricsEnabled: true,
        otelMetricsTemporality: 'CUMULATIVE',
        prometheusMetricsEnabled: false,
        region: 'local',
      })),
    }))
    vi.doMock('@internal/monitoring/logger', () => ({
      logger: { info: vi.fn() },
      logSchema: { error: vi.fn(), info: vi.fn() },
    }))
    vi.doMock('@internal/monitoring/system', () => ({
      StorageNodeInstrumentation,
    }))
    vi.doMock('@opentelemetry/api', () => ({
      metrics: {
        setGlobalMeterProvider: vi.fn(),
      },
    }))
    vi.doMock('@opentelemetry/exporter-metrics-otlp-grpc', () => ({
      OTLPMetricExporter: vi.fn(function () {
        return {}
      }),
    }))
    vi.doMock('@opentelemetry/exporter-prometheus', () => ({
      PrometheusExporter,
    }))
    vi.doMock('@opentelemetry/host-metrics', () => ({
      HostMetrics,
    }))
    vi.doMock('@opentelemetry/instrumentation', () => ({
      registerInstrumentations,
    }))
    vi.doMock('@opentelemetry/instrumentation-runtime-node', () => ({
      RuntimeNodeInstrumentation,
    }))
    vi.doMock('@opentelemetry/resources', () => ({
      resourceFromAttributes: vi.fn(() => ({})),
    }))
    vi.doMock('@opentelemetry/sdk-metrics', () => ({
      AggregationTemporality: {
        CUMULATIVE: 'CUMULATIVE',
        DELTA: 'DELTA',
      },
      AggregationType: {
        DROP: 'DROP',
        EXPLICIT_BUCKET_HISTOGRAM: 'EXPLICIT_BUCKET_HISTOGRAM',
      },
      MeterProvider,
      PeriodicExportingMetricReader: vi.fn(),
    }))

    await importOtelMetricsModule()

    expect(MeterProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        views: expect.arrayContaining([
          expect.objectContaining({
            meterName: 'storage-api',
            instrumentName: 'http_request_duration_seconds',
            aggregationCardinalityLimit: HTTP_SIZE_METRICS_AGGREGATION_CARDINALITY_LIMIT,
          }),
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
            meterName: '@opentelemetry/instrumentation-runtime-node',
            instrumentName: 'v8js.gc.duration',
            aggregation: {
              type: 'EXPLICIT_BUCKET_HISTOGRAM',
              options: {
                boundaries: [
                  0.0001, 0.00025, 0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5,
                  1, 2.5, 5, 10, 30,
                ],
              },
            },
          },
        ]),
      })
    )
  })

  test('does not create a Prometheus reader when Prometheus metrics are disabled', async () => {
    const registerInstrumentations = vi.fn(() => vi.fn())
    const HostMetrics = vi.fn(function () {
      return {
        start: vi.fn(),
      }
    })
    const MeterProvider = vi.fn(function () {
      return {
        shutdown: vi.fn().mockResolvedValue(undefined),
        getMeter: vi.fn(() => ({})),
      }
    })
    const PrometheusExporter = vi.fn(function () {
      return {
        getMetricsRequestHandler: vi.fn(),
      }
    })
    const RuntimeNodeInstrumentation = vi.fn(function () {
      return {}
    })
    const StorageNodeInstrumentation = vi.fn(function () {
      return {}
    })

    vi.doMock('../../config', () => ({
      getConfig: vi.fn(() => ({
        version: 'test-version',
        otelMetricsExportIntervalMs: 1000,
        otelMetricsEnabled: true,
        otelMetricsTemporality: 'CUMULATIVE',
        prometheusMetricsEnabled: false,
        region: 'local',
      })),
    }))
    vi.doMock('@internal/monitoring/logger', () => ({
      logger: { info: vi.fn() },
      logSchema: { error: vi.fn(), info: vi.fn() },
    }))
    vi.doMock('@internal/monitoring/system', () => ({
      StorageNodeInstrumentation,
    }))
    vi.doMock('@opentelemetry/api', () => ({
      metrics: {
        setGlobalMeterProvider: vi.fn(),
      },
    }))
    vi.doMock('@opentelemetry/exporter-metrics-otlp-grpc', () => ({
      OTLPMetricExporter: vi.fn(function () {
        return {}
      }),
    }))
    vi.doMock('@opentelemetry/exporter-prometheus', () => ({
      PrometheusExporter,
    }))
    vi.doMock('@opentelemetry/host-metrics', () => ({
      HostMetrics,
    }))
    vi.doMock('@opentelemetry/instrumentation', () => ({
      registerInstrumentations,
    }))
    vi.doMock('@opentelemetry/instrumentation-runtime-node', () => ({
      RuntimeNodeInstrumentation,
    }))
    vi.doMock('@opentelemetry/resources', () => ({
      resourceFromAttributes: vi.fn(() => ({})),
    }))
    vi.doMock('@opentelemetry/sdk-metrics', () => ({
      AggregationTemporality: {
        CUMULATIVE: 'CUMULATIVE',
        DELTA: 'DELTA',
      },
      AggregationType: {
        DROP: 'DROP',
        EXPLICIT_BUCKET_HISTOGRAM: 'EXPLICIT_BUCKET_HISTOGRAM',
      },
      MeterProvider,
      PeriodicExportingMetricReader: vi.fn(),
    }))

    await importOtelMetricsModule()

    expect(PrometheusExporter).not.toHaveBeenCalled()
    expect(MeterProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        readers: [],
      })
    )
  })

  test('uses Watt worker identity as the OTel service instance id', async () => {
    const registerInstrumentations = vi.fn(() => vi.fn())
    const resourceFromAttributes = vi.fn((attributes) => attributes)
    const HostMetrics = vi.fn(function () {
      return {
        start: vi.fn(),
      }
    })
    const MeterProvider = vi.fn(function () {
      return {
        shutdown: vi.fn().mockResolvedValue(undefined),
        getMeter: vi.fn(() => ({})),
      }
    })
    const prometheusExporterOptions: Array<{ withResourceConstantLabels: RegExp }> = []
    const PrometheusExporter = vi.fn(function (options: { withResourceConstantLabels: RegExp }) {
      prometheusExporterOptions.push(options)
      return {
        getMetricsRequestHandler: vi.fn(),
      }
    })
    const RuntimeNodeInstrumentation = vi.fn(function () {
      return {}
    })
    const StorageNodeInstrumentation = vi.fn(function () {
      return {}
    })

    vi.doMock('../../config', () => ({
      getConfig: vi.fn(() => ({
        version: 'test-version',
        otelMetricsExportIntervalMs: 1000,
        otelMetricsEnabled: true,
        otelMetricsTemporality: 'CUMULATIVE',
        prometheusMetricsEnabled: true,
        region: 'local',
        serviceName: 'storage-api',
      })),
    }))
    vi.doMock('@platformatic/globals', () => ({
      getGlobal: vi.fn(() => ({
        applicationId: 'storage-api:tenant',
        workerId: '3',
      })),
    }))
    vi.doMock('os', () => ({
      hostname: vi.fn(() => 'storage-host-a'),
    }))
    vi.doMock('@internal/monitoring/logger', () => ({
      logger: { info: vi.fn() },
      logSchema: { error: vi.fn(), info: vi.fn() },
    }))
    vi.doMock('@internal/monitoring/system', () => ({
      StorageNodeInstrumentation,
    }))
    vi.doMock('@opentelemetry/api', () => ({
      metrics: {
        setGlobalMeterProvider: vi.fn(),
      },
    }))
    vi.doMock('@opentelemetry/exporter-metrics-otlp-grpc', () => ({
      OTLPMetricExporter: vi.fn(function () {
        return {}
      }),
    }))
    vi.doMock('@opentelemetry/exporter-prometheus', () => ({
      PrometheusExporter,
    }))
    vi.doMock('@opentelemetry/host-metrics', () => ({
      HostMetrics,
    }))
    vi.doMock('@opentelemetry/instrumentation', () => ({
      registerInstrumentations,
    }))
    vi.doMock('@opentelemetry/instrumentation-runtime-node', () => ({
      RuntimeNodeInstrumentation,
    }))
    vi.doMock('@opentelemetry/resources', () => ({
      resourceFromAttributes,
    }))
    vi.doMock('@opentelemetry/sdk-metrics', () => ({
      AggregationTemporality: {
        CUMULATIVE: 'CUMULATIVE',
        DELTA: 'DELTA',
      },
      AggregationType: {
        DROP: 'DROP',
        EXPLICIT_BUCKET_HISTOGRAM: 'EXPLICIT_BUCKET_HISTOGRAM',
      },
      MeterProvider,
      PeriodicExportingMetricReader: vi.fn(),
    }))

    await importOtelMetricsModule()

    expect(resourceFromAttributes).toHaveBeenCalledWith(
      expect.objectContaining({
        instance: 'storage-host-a',
        'service.instance.id': 'storage-host-a:storage-api:tenant:worker:3',
        'platformatic.application.id': 'storage-api:tenant',
        'worker.id': '3',
        'process.pid': process.pid,
      })
    )
    expect(PrometheusExporter).toHaveBeenCalledWith(
      expect.objectContaining({
        withResourceConstantLabels: expect.objectContaining({
          test: expect.any(Function),
        }),
      })
    )

    const prometheusLabelFilter = prometheusExporterOptions[0].withResourceConstantLabels
    expect(prometheusLabelFilter.test('service.instance.id')).toBe(true)
    expect(prometheusLabelFilter.test('worker.id')).toBe(true)
    expect(prometheusLabelFilter.test('platformatic.application.id')).toBe(true)
  })

  test('collector promotes service instance identity to metric labels', () => {
    const collectorConfig = fs.readFileSync(
      'monitoring/otel/config/otel-collector-config.yml',
      'utf8'
    )

    expect(collectorConfig).toContain(
      'set(attributes["service_instance_id"], resource.attributes["service.instance.id"])'
    )
    expect(collectorConfig).toContain(
      'set(attributes["worker_id"], resource.attributes["worker.id"])'
    )
    expect(collectorConfig).toContain(
      'set(attributes["platformatic_application_id"], resource.attributes["platformatic.application.id"])'
    )
  })

  test('collector removes service instance resource before Prometheus conversion', () => {
    const collectorConfig = fs.readFileSync(
      'monitoring/otel/config/otel-collector-config.yml',
      'utf8'
    )

    expect(collectorConfig).toContain('delete_key(attributes, "service.instance.id")')
  })
})
