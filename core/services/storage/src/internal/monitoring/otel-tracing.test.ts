interface OTelGlobalState {
  __otelTracingShutdown?: () => Promise<void>
}

import { vi } from 'vitest'

const mockedTracingModules = [
  '@opentelemetry/sdk-node',
  '@opentelemetry/instrumentation',
  '@opentelemetry/auto-instrumentations-node',
  '@fastify/otel',
  '@opentelemetry/exporter-trace-otlp-grpc',
  '@internal/monitoring/logger',
  './otel-class-instrumentations',
] as const

async function importOtelTracingModule() {
  await import('./otel-tracing')
  return (globalThis as typeof globalThis & OTelGlobalState).__otelTracingShutdown
}

describe('otel tracing bootstrap', () => {
  const originalTracingEnabled = process.env.TRACING_ENABLED
  const originalTraceEndpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
  const originalTraceHeaders = process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.TRACING_ENABLED = 'true'
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = 'http://127.0.0.1:4317'
    delete process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS
  })

  afterEach(async () => {
    const otelGlobalState = globalThis as typeof globalThis & OTelGlobalState

    if (otelGlobalState.__otelTracingShutdown) {
      await otelGlobalState.__otelTracingShutdown()
      delete otelGlobalState.__otelTracingShutdown
    }

    if (originalTracingEnabled === undefined) {
      delete process.env.TRACING_ENABLED
    } else {
      process.env.TRACING_ENABLED = originalTracingEnabled
    }

    if (originalTraceEndpoint === undefined) {
      delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
    } else {
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = originalTraceEndpoint
    }

    if (originalTraceHeaders === undefined) {
      delete process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS
    } else {
      process.env.OTEL_EXPORTER_OTLP_TRACES_HEADERS = originalTraceHeaders
    }

    for (const moduleId of mockedTracingModules) {
      vi.doUnmock(moduleId)
    }

    vi.restoreAllMocks()
  })

  test('does not let tracing sdk create a hidden metrics pipeline', async () => {
    const start = vi.fn()
    const shutdown = vi.fn().mockResolvedValue(undefined)
    const NodeSDK = vi.fn(function () {
      return {
        start,
        shutdown,
      }
    })
    const registerInstrumentations = vi.fn(() => vi.fn())
    const getNodeAutoInstrumentations = vi.fn().mockReturnValue([])
    const FastifyOtelInstrumentation = vi.fn(function (config) {
      return {
        instrumentationName: '@fastify/otel',
        config,
      }
    })
    const OTLPTraceExporter = vi.fn(function () {
      return {}
    })

    vi.doMock('@opentelemetry/sdk-node', () => ({
      NodeSDK,
    }))
    vi.doMock('@opentelemetry/instrumentation', () => ({
      registerInstrumentations,
    }))
    vi.doMock('@opentelemetry/auto-instrumentations-node', () => ({
      getNodeAutoInstrumentations,
    }))
    vi.doMock('@fastify/otel', () => ({
      FastifyOtelInstrumentation,
    }))
    vi.doMock('@opentelemetry/exporter-trace-otlp-grpc', () => ({
      OTLPTraceExporter,
    }))

    await importOtelTracingModule()

    expect(NodeSDK).toHaveBeenCalledWith(
      expect.objectContaining({
        metricReaders: [],
      })
    )

    expect(getNodeAutoInstrumentations).toHaveBeenCalledWith(
      expect.objectContaining({
        '@opentelemetry/instrumentation-runtime-node': expect.objectContaining({
          enabled: false,
        }),
      })
    )

    expect(registerInstrumentations).toHaveBeenCalled()
    expect(start).toHaveBeenCalled()
  })

  test('does not register class instrumentations after shutdown starts', async () => {
    const start = vi.fn()
    const shutdown = vi.fn().mockResolvedValue(undefined)
    const unregisterTracingInstrumentations = vi.fn()
    const unregisterClassInstrumentations = vi.fn()
    const NodeSDK = vi.fn(function () {
      return {
        start,
        shutdown,
      }
    })
    const registerInstrumentations = vi
      .fn()
      .mockReturnValueOnce(unregisterTracingInstrumentations)
      .mockReturnValueOnce(unregisterClassInstrumentations)
    const getNodeAutoInstrumentations = vi.fn().mockReturnValue([])
    const FastifyOtelInstrumentation = vi.fn(function (config) {
      return {
        instrumentationName: '@fastify/otel',
        config,
      }
    })
    const OTLPTraceExporter = vi.fn(function () {
      return {}
    })
    const classInstrumentationsDeferred = Promise.withResolvers<{
      classInstrumentations: unknown[]
    }>()

    vi.doMock('@opentelemetry/sdk-node', () => ({
      NodeSDK,
    }))
    vi.doMock('@opentelemetry/instrumentation', () => ({
      registerInstrumentations,
    }))
    vi.doMock('@opentelemetry/auto-instrumentations-node', () => ({
      getNodeAutoInstrumentations,
    }))
    vi.doMock('@fastify/otel', () => ({
      FastifyOtelInstrumentation,
    }))
    vi.doMock('@opentelemetry/exporter-trace-otlp-grpc', () => ({
      OTLPTraceExporter,
    }))
    vi.doMock('./otel-class-instrumentations', () => ({
      loadClassInstrumentations: vi.fn(() => classInstrumentationsDeferred.promise),
    }))

    const shutdownOtelTracing = await importOtelTracingModule()

    const shutdownPromise = shutdownOtelTracing?.()

    classInstrumentationsDeferred.resolve({ classInstrumentations: [] })

    await shutdownPromise

    expect(registerInstrumentations).toHaveBeenCalledTimes(1)
    expect(unregisterTracingInstrumentations).toHaveBeenCalledTimes(1)
    expect(unregisterClassInstrumentations).not.toHaveBeenCalled()
    expect(shutdown).toHaveBeenCalledTimes(1)
  })

  test('still shuts down sdk when unregister callbacks throw', async () => {
    const start = vi.fn()
    const shutdown = vi.fn().mockResolvedValue(undefined)
    const unregisterTracingError = new Error('tracing unregister failed')
    const unregisterClassError = new Error('class unregister failed')
    const unregisterTracingInstrumentations = vi.fn(() => {
      throw unregisterTracingError
    })
    const unregisterClassInstrumentations = vi.fn(() => {
      throw unregisterClassError
    })
    const NodeSDK = vi.fn(function () {
      return {
        start,
        shutdown,
      }
    })
    const registerInstrumentations = vi
      .fn()
      .mockReturnValueOnce(unregisterTracingInstrumentations)
      .mockReturnValueOnce(unregisterClassInstrumentations)
    const getNodeAutoInstrumentations = vi.fn().mockReturnValue([])
    const FastifyOtelInstrumentation = vi.fn(function (config) {
      return {
        instrumentationName: '@fastify/otel',
        config,
      }
    })
    const OTLPTraceExporter = vi.fn(function () {
      return {}
    })
    const classInstrumentationsDeferred = Promise.withResolvers<unknown[]>()
    const logSchema = {
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    }

    vi.doMock('@opentelemetry/sdk-node', () => ({
      NodeSDK,
    }))
    vi.doMock('@opentelemetry/instrumentation', () => ({
      registerInstrumentations,
    }))
    vi.doMock('@opentelemetry/auto-instrumentations-node', () => ({
      getNodeAutoInstrumentations,
    }))
    vi.doMock('@fastify/otel', () => ({
      FastifyOtelInstrumentation,
    }))
    vi.doMock('@opentelemetry/exporter-trace-otlp-grpc', () => ({
      OTLPTraceExporter,
    }))
    vi.doMock('@internal/monitoring/logger', () => ({
      logger: {},
      logSchema,
    }))
    vi.doMock('./otel-class-instrumentations', () => ({
      loadClassInstrumentations: vi.fn(() => classInstrumentationsDeferred.promise),
    }))

    const shutdownOtelTracing = await importOtelTracingModule()

    classInstrumentationsDeferred.resolve([])
    await classInstrumentationsDeferred.promise
    await new Promise((resolve) => setImmediate(resolve))

    expect(registerInstrumentations).toHaveBeenCalledTimes(2)

    await expect(shutdownOtelTracing?.()).resolves.toBeUndefined()

    expect(unregisterClassInstrumentations).toHaveBeenCalledTimes(1)
    expect(unregisterTracingInstrumentations).toHaveBeenCalledTimes(1)
    expect(shutdown).toHaveBeenCalledTimes(1)
    expect(logSchema.error).toHaveBeenCalledWith(
      {},
      '[Otel] Failed to unregister class instrumentations',
      expect.objectContaining({ type: 'otel', error: unregisterClassError })
    )
    expect(logSchema.error).toHaveBeenCalledWith(
      {},
      '[Otel] Failed to unregister tracing instrumentations',
      expect.objectContaining({ type: 'otel', error: unregisterTracingError })
    )
  })
})
