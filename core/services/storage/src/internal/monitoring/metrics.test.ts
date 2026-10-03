import type { BatchObservableCallback, Meter, Observable } from '@opentelemetry/api'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { HTTP_SIZE_METRICS_MAX_STATES } from './metric-limits'

interface CapturedObservable {
  name: string
  callback: (observer: {
    observe: (value: number, attributes?: Record<string, unknown>) => void
  }) => void
}

interface CapturedObservation {
  value: number
  attributes?: Record<string, unknown>
}

interface CapturedBatchObservable {
  callback: BatchObservableCallback
  observables: Observable[]
}

function createMockMeter(): {
  meter: Meter
  invoke: (name: string) => CapturedObservation[]
} {
  const observables: CapturedObservable[] = []
  const batchObservables: CapturedBatchObservable[] = []
  const observableNames = new Map<Observable, string>()
  const noopMetric = {
    add: vi.fn(),
    record: vi.fn(),
  }

  const createObservable = () => (name: string) => {
    const observable = {
      addCallback(callback: CapturedObservable['callback']) {
        observables.push({ name, callback })
      },
      removeCallback: vi.fn(),
    } as unknown as Observable

    observableNames.set(observable, name)

    return observable
  }

  const meter = {
    createCounter: vi.fn(() => noopMetric),
    createGauge: vi.fn(() => noopMetric),
    createHistogram: vi.fn(() => noopMetric),
    createObservableCounter: vi.fn(createObservable()),
    createObservableGauge: vi.fn(createObservable()),
    createUpDownCounter: vi.fn(() => noopMetric),
    addBatchObservableCallback: vi.fn(
      (callback: BatchObservableCallback, observables: Observable[]) => {
        batchObservables.push({ callback, observables })
      }
    ),
    removeBatchObservableCallback: vi.fn(),
  } as unknown as Meter

  const invoke = (name: string): CapturedObservation[] => {
    const observations: CapturedObservation[] = []
    const observer = {
      observe: (value: number, attributes?: Record<string, unknown>) => {
        observations.push({ value, attributes })
      },
    }

    for (const observable of observables) {
      if (observable.name === name) {
        observable.callback(observer)
      }
    }

    for (const batchObservable of batchObservables) {
      const hasObservable = batchObservable.observables.some(
        (observable) => observableNames.get(observable) === name
      )

      if (!hasObservable) {
        continue
      }

      void batchObservable.callback({
        observe: (observable, value, attributes) => {
          if (observableNames.get(observable) === name) {
            observations.push({ value, attributes })
          }
        },
      })
    }

    return observations
  }

  return { meter, invoke }
}

async function importMetricsWithMockMeter() {
  vi.resetModules()

  const mockMeter = createMockMeter()
  vi.doMock('@opentelemetry/api', () => ({
    metrics: {
      getMeter: vi.fn(() => mockMeter.meter),
    },
  }))

  const metricsModule = await import('./metrics')
  return { metricsModule, mockMeter }
}

describe('metrics registry', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.doUnmock('@opentelemetry/api')
  })

  test('registers fixed counter instruments with the existing names and descriptions', async () => {
    const { mockMeter } = await importMetricsWithMockMeter()

    expect(mockMeter.meter.createObservableCounter).toHaveBeenCalledWith('upload_started', {
      description: 'Total uploads started',
    })
    expect(mockMeter.meter.createObservableCounter).toHaveBeenCalledWith('upload_success', {
      description: 'Total successful uploads',
    })
    expect(mockMeter.meter.createObservableCounter).toHaveBeenCalledWith('cache_requests_total', {
      description: 'Total cache lookups by cache and outcome',
    })
    expect(mockMeter.meter.createObservableCounter).toHaveBeenCalledWith('cache_evictions_total', {
      description: 'Total cache evictions',
    })
    expect(mockMeter.meter.createObservableCounter).toHaveBeenCalledWith(
      'db_tls_session_resumption_total',
      {
        description: 'Total DB TLS handshakes by session resumption outcome',
      }
    )
  })

  test('registers deferred pool retirement gauges with exact units and descriptions', async () => {
    const { mockMeter } = await importMetricsWithMockMeter()

    expect(mockMeter.meter.createObservableGauge).toHaveBeenCalledWith(
      'db_pools_pending_retirement',
      {
        description:
          'Number of capacity-evicted database pool strategies whose retirement has not completed',
      }
    )
    expect(mockMeter.meter.createObservableGauge).toHaveBeenCalledWith(
      'db_pool_oldest_pending_retirement_age_seconds',
      {
        description:
          'Age of the oldest capacity-evicted database pool strategy whose retirement has not completed',
        unit: 's',
      }
    )
  })

  test('observes cumulative cache counters with stable attributes even when disabled', async () => {
    const { metricsModule, mockMeter } = await importMetricsWithMockMeter()

    metricsModule.setMetricsEnabled([
      { name: 'cache_requests_total', enabled: false },
      { name: 'cache_evictions_total', enabled: false },
    ])
    metricsModule.recordCacheRequest('jwt', 'hit')
    metricsModule.recordCacheRequest('jwt_verification_key', 'miss')
    metricsModule.recordCacheRequest('pgvector_metric', 'hit')
    metricsModule.recordCacheRequest('pgvector_metric', 'miss')
    metricsModule.recordCacheRequest('tenant_config', 'hit')
    metricsModule.recordCacheRequest('tenant_config', 'hit')
    metricsModule.recordCacheRequest('tenant_config', 'miss')
    metricsModule.recordCacheRequest('tenant_jwks', 'miss')
    metricsModule.recordCacheRequest('tenant_pool', 'miss')
    metricsModule.recordCacheRequest('tenant_s3_credentials', 'hit')
    metricsModule.recordCacheEviction('pgvector_metric')
    metricsModule.recordCacheEviction('jwt_verification_key')
    metricsModule.recordCacheEviction('tenant_config')

    const firstRequestCollection = mockMeter.invoke('cache_requests_total')
    const secondRequestCollection = mockMeter.invoke('cache_requests_total')

    expect(firstRequestCollection).toEqual([
      {
        value: 1,
        attributes: { cache: 'jwt', outcome: 'hit' },
      },
      {
        value: 1,
        attributes: { cache: 'jwt_verification_key', outcome: 'miss' },
      },
      {
        value: 1,
        attributes: { cache: 'pgvector_metric', outcome: 'hit' },
      },
      {
        value: 1,
        attributes: { cache: 'pgvector_metric', outcome: 'miss' },
      },
      {
        value: 2,
        attributes: { cache: 'tenant_config', outcome: 'hit' },
      },
      {
        value: 1,
        attributes: { cache: 'tenant_config', outcome: 'miss' },
      },
      {
        value: 1,
        attributes: { cache: 'tenant_jwks', outcome: 'miss' },
      },
      {
        value: 1,
        attributes: { cache: 'tenant_pool', outcome: 'miss' },
      },
      {
        value: 1,
        attributes: { cache: 'tenant_s3_credentials', outcome: 'hit' },
      },
    ])
    expect(secondRequestCollection).toEqual(firstRequestCollection)
    expect(secondRequestCollection[0].attributes).toBe(firstRequestCollection[0].attributes)

    expect(mockMeter.invoke('cache_evictions_total')).toEqual([
      {
        value: 1,
        attributes: { cache: 'jwt_verification_key' },
      },
      {
        value: 1,
        attributes: { cache: 'pgvector_metric' },
      },
      {
        value: 1,
        attributes: { cache: 'tenant_config' },
      },
    ])
  })

  test('accumulates request and response bytes independently, even when disabled', async () => {
    const { metricsModule, mockMeter } = await importMetricsWithMockMeter()

    const method = 'POST'
    const operation = 'object.upload'
    const statusCode = 200
    const attributes = { method, operation, status_code: String(statusCode) }

    metricsModule.setMetricsEnabled([
      { name: 'http_request_size_bytes', enabled: false },
      { name: 'http_response_size_bytes', enabled: false },
    ])
    metricsModule.recordHttpRequestMetrics(0.001, 7, 2, method, operation, statusCode)
    metricsModule.recordHttpRequestMetrics(0.001, 3, undefined, method, operation, statusCode)
    metricsModule.recordHttpRequestMetrics(0.001, undefined, 5, method, operation, statusCode)

    expect(mockMeter.invoke('http_request_size_bytes')).toEqual([
      {
        value: 10,
        attributes,
      },
    ])

    expect(mockMeter.invoke('http_response_size_bytes')).toEqual([
      {
        value: 7,
        attributes,
      },
    ])
  })

  test('keeps http byte counters below the safe threshold', async () => {
    const { metricsModule, mockMeter } = await importMetricsWithMockMeter()
    const safeCounterThreshold = Number.MAX_SAFE_INTEGER - 1_000_000_000

    const method = 'POST'
    const operation = 'object.upload'
    const statusCode = 200
    const attributes = { method, operation, status_code: String(statusCode) }

    metricsModule.recordHttpRequestMetrics(
      0.001,
      safeCounterThreshold - 1,
      undefined,
      method,
      operation,
      statusCode
    )
    metricsModule.recordHttpRequestMetrics(0.001, 2, undefined, method, operation, statusCode)
    metricsModule.recordHttpRequestMetrics(
      0.001,
      undefined,
      Number.MAX_SAFE_INTEGER,
      method,
      operation,
      statusCode
    )

    expect(mockMeter.invoke('http_request_size_bytes')).toEqual([
      {
        value: safeCounterThreshold,
        attributes,
      },
    ])

    expect(mockMeter.invoke('http_response_size_bytes')).toEqual([
      {
        value: safeCounterThreshold,
        attributes,
      },
    ])
  })

  test('ignores invalid http byte sizes without poisoning later observations', async () => {
    const { metricsModule, mockMeter } = await importMetricsWithMockMeter()

    const method = 'POST'
    const operation = 'object.upload'
    const statusCode = 200
    const attributes = { method, operation, status_code: String(statusCode) }

    metricsModule.recordHttpRequestMetrics(
      0.001,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      method,
      operation,
      statusCode
    )
    metricsModule.recordHttpRequestMetrics(0.001, 7, 2, method, operation, statusCode)

    expect(mockMeter.invoke('http_request_size_bytes')).toEqual([
      {
        value: 7,
        attributes,
      },
    ])

    expect(mockMeter.invoke('http_response_size_bytes')).toEqual([
      {
        value: 2,
        attributes,
      },
    ])
  })

  test('routes new http metric states to overflow after the cap', async () => {
    const { metricsModule, mockMeter } = await importMetricsWithMockMeter()

    for (let i = 0; i <= HTTP_SIZE_METRICS_MAX_STATES; i++) {
      metricsModule.recordHttpRequestMetrics(0.001, 1, undefined, 'GET', `operation-${i}`, 200)
    }

    expect(mockMeter.invoke('http_request_size_bytes')).toEqual(
      expect.arrayContaining([
        {
          value: 1,
          attributes: {
            method: 'overflow',
            operation: 'overflow',
            status_code: 'overflow',
          },
        },
      ])
    )
  })

  test('observes cumulative upload counters with stable attributes even when disabled', async () => {
    const { metricsModule, mockMeter } = await importMetricsWithMockMeter()

    metricsModule.setMetricsEnabled([
      { name: 'upload_started', enabled: false },
      { name: 'upload_success', enabled: false },
    ])
    metricsModule.recordUploadStarted('standard')
    metricsModule.recordUploadStarted('standard')
    metricsModule.recordUploadStarted('s3')
    metricsModule.recordUploadStarted('resumable')
    metricsModule.recordUploadSuccess('standard')
    metricsModule.recordUploadSuccess('resumable')

    const firstStartedCollection = mockMeter.invoke('upload_started')
    const secondStartedCollection = mockMeter.invoke('upload_started')

    expect(firstStartedCollection).toEqual([
      {
        value: 2,
        attributes: { uploadType: 'standard' },
      },
      {
        value: 1,
        attributes: { uploadType: 's3' },
      },
      {
        value: 1,
        attributes: { uploadType: 'resumable' },
      },
    ])
    expect(secondStartedCollection).toEqual(firstStartedCollection)
    expect(secondStartedCollection[0].attributes).toBe(firstStartedCollection[0].attributes)

    expect(mockMeter.invoke('upload_success')).toEqual([
      {
        value: 1,
        attributes: { uploadType: 'standard' },
      },
      {
        value: 1,
        attributes: { uploadType: 'resumable' },
      },
    ])
  })

  test('observes cumulative TLS session counters for every fixed outcome', async () => {
    const { metricsModule, mockMeter } = await importMetricsWithMockMeter()

    metricsModule.setMetricsEnabled([{ name: 'db_tls_session_resumption_total', enabled: false }])
    metricsModule.recordTlsSessionResumption('resumed')
    metricsModule.recordTlsSessionResumption('resumed')
    metricsModule.recordTlsSessionResumption('rejected')
    metricsModule.recordTlsSessionResumption('uncached')

    const firstCollection = mockMeter.invoke('db_tls_session_resumption_total')
    const secondCollection = mockMeter.invoke('db_tls_session_resumption_total')

    expect(firstCollection).toEqual([
      {
        value: 2,
        attributes: { outcome: 'resumed' },
      },
      {
        value: 1,
        attributes: { outcome: 'rejected' },
      },
      {
        value: 1,
        attributes: { outcome: 'uncached' },
      },
    ])
    expect(secondCollection).toEqual(firstCollection)
    expect(secondCollection[0].attributes).toBe(firstCollection[0].attributes)
  })
})
