import type { CacheLookupOutcome } from '@internal/cache/adapter'
import type { CacheName } from '@internal/cache/names'
import { type Attributes, metrics, type Observable } from '@opentelemetry/api'
import { HTTP_SIZE_METRICS_MAX_STATES } from './metric-limits'

const SAFE_COUNTER_THRESHOLD = Number.MAX_SAFE_INTEGER - 1_000_000_000

function safeAddCounter(current: number, amount: number): number {
  const next = current + amount

  if (
    current >= SAFE_COUNTER_THRESHOLD ||
    next >= SAFE_COUNTER_THRESHOLD ||
    !Number.isSafeInteger(next)
  ) {
    return SAFE_COUNTER_THRESHOLD
  }

  return next
}

type ObservableCounterSeries = {
  count: number
  attributes: Attributes
}

// Cache, upload, and TLS dimensions are closed. Their states are predeclared below so cumulative
// series never reset through eviction and hot recorders only perform a direct lookup and increment.
function incrementCounter(series: ObservableCounterSeries): void {
  if (series.count < SAFE_COUNTER_THRESHOLD) {
    series.count++
  }
}

// Cumulative counter series are only exported once they have counted something,
// so a fresh process does not emit zero-valued points for every dimension.
function registerCounterSeriesObservation(
  observable: Observable,
  seriesList: readonly ObservableCounterSeries[]
): void {
  meter.addBatchObservableCallback(
    (observer) => {
      for (const series of seriesList) {
        if (series.count > 0) {
          observer.observe(observable, series.count, series.attributes)
        }
      }
    },
    [observable]
  )
}

// ============================================================================
// Metric Registry
// ============================================================================
export type MetricType = 'histogram' | 'counter' | 'gauge' | 'updowncounter'

export interface MetricRegistryEntry {
  name: string
  type: MetricType
  enabled: boolean
}

const metricsRegistry = new Map<string, MetricRegistryEntry>()

const disabledMetrics = new Set(
  (process.env.METRICS_DISABLED || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
)

/** Enable or disable specific metrics by OTel instrument name. */
export function setMetricsEnabled(changes: { name: string; enabled: boolean }[]): void {
  for (const { name, enabled } of changes) {
    const entry = metricsRegistry.get(name)
    if (entry) {
      entry.enabled = enabled
    }
  }
}

/** Check if a metric is enabled (for observable gauges that emit via callbacks) */
export function isMetricEnabled(name: string): boolean {
  return metricsRegistry.get(name)?.enabled !== false
}

// ============================================================================
// Meter & registration
// ============================================================================
export const meter = metrics.getMeter('storage-api')

/**
 * Registers a metric in the admin registry.
 */
export function registerMetric<T>(name: string, type: MetricType, factory: () => T): T {
  metricsRegistry.set(name, { name, type, enabled: !disabledMetrics.has(name) })
  return factory()
}

// ============================================================================
// HTTP Request Metrics
//
// HTTP byte counters intentionally do not check `isMetricEnabled()`. They use
// cumulative observable counters, so skipping observations on runtime disable
// would leave stale exported points and later jumps on re-enable.
// ============================================================================
type HttpSizeMetricsState = {
  requestBytes: number
  responseBytes: number
  attributes: Attributes
}

const HTTP_METRICS_OVERFLOW_LABEL = 'overflow'

const httpStatusCodeLabels = new Map<number, string>()
const httpSizeMetricStates = new Set<HttpSizeMetricsState>()
// Nested maps avoid allocating a composite key on the HTTP request hot path.
const httpSizeMetricsByMethod = new Map<string, Map<string, Map<number, HttpSizeMetricsState>>>()
let httpSizeMetricStateCount = 0

const httpSizeOverflowState = createHttpSizeMetricsState(
  HTTP_METRICS_OVERFLOW_LABEL,
  HTTP_METRICS_OVERFLOW_LABEL,
  HTTP_METRICS_OVERFLOW_LABEL
)
httpSizeMetricStates.add(httpSizeOverflowState)

function isRecordableMetricValue(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function createHttpSizeMetricsState(
  method: string,
  operation: string,
  statusCodeLabel: string
): HttpSizeMetricsState {
  return {
    requestBytes: 0,
    responseBytes: 0,
    attributes: {
      method,
      operation,
      status_code: statusCodeLabel,
    },
  }
}

function getStatusCodeLabel(statusCode: number): string {
  let label = httpStatusCodeLabels.get(statusCode)

  if (!label) {
    label = String(statusCode)
    httpStatusCodeLabels.set(statusCode, label)
  }

  return label
}

function getHttpSizeMetricsState(
  method: string,
  operation: string,
  statusCode: number
): HttpSizeMetricsState {
  let byOperation = httpSizeMetricsByMethod.get(method)

  if (!byOperation) {
    if (httpSizeMetricStateCount >= HTTP_SIZE_METRICS_MAX_STATES) {
      return httpSizeOverflowState
    }

    byOperation = new Map()
    httpSizeMetricsByMethod.set(method, byOperation)
  }

  let byStatusCode = byOperation.get(operation)

  if (!byStatusCode) {
    if (httpSizeMetricStateCount >= HTTP_SIZE_METRICS_MAX_STATES) {
      return httpSizeOverflowState
    }

    byStatusCode = new Map()
    byOperation.set(operation, byStatusCode)
  }

  let state = byStatusCode.get(statusCode)

  if (!state) {
    if (httpSizeMetricStateCount >= HTTP_SIZE_METRICS_MAX_STATES) {
      return httpSizeOverflowState
    }

    state = createHttpSizeMetricsState(method, operation, getStatusCodeLabel(statusCode))
    byStatusCode.set(statusCode, state)
    httpSizeMetricStates.add(state)
    httpSizeMetricStateCount++
  }

  return state
}

export const httpRequestDuration = registerMetric(
  'http_request_duration_seconds',
  'histogram',
  () =>
    meter.createHistogram('http_request_duration_seconds', {
      description: 'HTTP request duration in seconds',
      unit: 's',
    })
)

const httpRequestSizeBytes = registerMetric('http_request_size_bytes', 'counter', () =>
  meter.createObservableCounter('http_request_size_bytes', {
    description: 'Total bytes received in HTTP requests (from content-length header)',
    unit: 'bytes',
  })
)

const httpResponseSizeBytes = registerMetric('http_response_size_bytes', 'counter', () =>
  meter.createObservableCounter('http_response_size_bytes', {
    description: 'Total bytes sent in HTTP responses (from content-length header)',
    unit: 'bytes',
  })
)

meter.addBatchObservableCallback(
  (observer) => {
    for (const state of httpSizeMetricStates) {
      if (state.requestBytes > 0) {
        observer.observe(httpRequestSizeBytes, state.requestBytes, state.attributes)
      }
      if (state.responseBytes > 0) {
        observer.observe(httpResponseSizeBytes, state.responseBytes, state.attributes)
      }
    }
  },
  [httpRequestSizeBytes, httpResponseSizeBytes]
)

function recordHttpByteSizesForState(
  state: HttpSizeMetricsState,
  requestSizeBytes: number | undefined,
  responseSizeBytes: number | undefined
): void {
  if (isRecordableMetricValue(requestSizeBytes)) {
    state.requestBytes = safeAddCounter(state.requestBytes, requestSizeBytes)
  }

  if (isRecordableMetricValue(responseSizeBytes)) {
    state.responseBytes = safeAddCounter(state.responseBytes, responseSizeBytes)
  }
}

export function recordHttpRequestMetrics(
  durationSeconds: number,
  requestSizeBytes: number | undefined,
  responseSizeBytes: number | undefined,
  method: string,
  operation: string,
  statusCode: number
): void {
  const state = getHttpSizeMetricsState(method, operation, statusCode)

  httpRequestDuration.record(durationSeconds, state.attributes)
  recordHttpByteSizesForState(state, requestSizeBytes, responseSizeBytes)
}

// ============================================================================
// Upload Metrics
//
// Upload counters follow the same cumulative observable-counter semantics as
// HTTP/cache: runtime disables must not suppress observations.
// ============================================================================
type UploadMetricsState = {
  started: ObservableCounterSeries
  success: ObservableCounterSeries
}

type UploadType = 'standard' | 's3' | 'resumable'

function createUploadMetricsState(uploadType: UploadType): UploadMetricsState {
  return {
    started: { count: 0, attributes: { uploadType } },
    success: { count: 0, attributes: { uploadType } },
  }
}

const uploadMetrics = {
  standard: createUploadMetricsState('standard'),
  s3: createUploadMetricsState('s3'),
  resumable: createUploadMetricsState('resumable'),
} satisfies Record<UploadType, UploadMetricsState>
const uploadMetricStates = Object.values(uploadMetrics)

const uploadStarted = registerMetric('upload_started', 'counter', () =>
  meter.createObservableCounter('upload_started', {
    description: 'Total uploads started',
  })
)

const uploadSuccess = registerMetric('upload_success', 'counter', () =>
  meter.createObservableCounter('upload_success', {
    description: 'Total successful uploads',
  })
)

registerCounterSeriesObservation(
  uploadStarted,
  uploadMetricStates.map((state) => state.started)
)
registerCounterSeriesObservation(
  uploadSuccess,
  uploadMetricStates.map((state) => state.success)
)

/** Records an upload start by bumping an in-process tally. */
export function recordUploadStarted(uploadType: UploadType): void {
  incrementCounter(uploadMetrics[uploadType].started)
}

/** Records an upload success by bumping an in-process tally. */
export function recordUploadSuccess(uploadType: UploadType): void {
  incrementCounter(uploadMetrics[uploadType].success)
}

// ============================================================================
// Cache Metrics
//
// These observable counters intentionally do not check `isMetricEnabled()`.
// With cumulative async OTel instruments, skipping `observe()` after a runtime
// disable can keep the previous point exported, then jump on re-enable because
// the in-process tally kept advancing. Drop these metrics at exporter/view
// configuration if they need to be suppressed entirely.
// ============================================================================
type CacheMetricsState = {
  requests: Record<CacheLookupOutcome, ObservableCounterSeries>
  evictions: ObservableCounterSeries
}

function createCacheMetricsState(cache: CacheName): CacheMetricsState {
  return {
    requests: {
      hit: { count: 0, attributes: { cache, outcome: 'hit' } },
      miss: { count: 0, attributes: { cache, outcome: 'miss' } },
    },
    evictions: { count: 0, attributes: { cache } },
  }
}

const cacheMetrics = {
  jwt: createCacheMetricsState('jwt'),
  jwt_signing_key: createCacheMetricsState('jwt_signing_key'),
  jwt_verification_key: createCacheMetricsState('jwt_verification_key'),
  pgvector_metric: createCacheMetricsState('pgvector_metric'),
  tenant_config: createCacheMetricsState('tenant_config'),
  tenant_jwks: createCacheMetricsState('tenant_jwks'),
  tenant_pool: createCacheMetricsState('tenant_pool'),
  tenant_s3_credentials: createCacheMetricsState('tenant_s3_credentials'),
} satisfies Record<CacheName, CacheMetricsState>
const cacheMetricStates = Object.values(cacheMetrics)
const cacheRequestMetricStates = cacheMetricStates.flatMap((state) => [
  state.requests.hit,
  state.requests.miss,
])
const cacheEvictionMetricStates = cacheMetricStates.map((state) => state.evictions)

const cacheRequests = registerMetric('cache_requests_total', 'counter', () =>
  meter.createObservableCounter('cache_requests_total', {
    description: 'Total cache lookups by cache and outcome',
  })
)

const cacheEvictions = registerMetric('cache_evictions_total', 'counter', () =>
  meter.createObservableCounter('cache_evictions_total', {
    description: 'Total cache evictions',
  })
)

registerCounterSeriesObservation(cacheRequests, cacheRequestMetricStates)
registerCounterSeriesObservation(cacheEvictions, cacheEvictionMetricStates)

/** Records a single cache lookup outcome by bumping an in-process tally. */
export function recordCacheRequest(cache: CacheName, outcome: CacheLookupOutcome): void {
  incrementCounter(cacheMetrics[cache].requests[outcome])
}

/** Records a single capacity/ttl cache eviction by bumping an in-process tally. */
export function recordCacheEviction(cache: CacheName): void {
  incrementCounter(cacheMetrics[cache].evictions)
}

export const cacheEntries = registerMetric('cache_entries', 'gauge', () =>
  meter.createObservableGauge('cache_entries', {
    description: 'Current number of entries stored in each cache',
  })
)

// ============================================================================
// DB TLS Session Resumption Metrics
//
// * resumed: the offered session was accepted
// * rejected: a session was offered but the server completed a full handshake
//             stale/rotated ticket or no server support
// * uncached: no session was available to offer (cold host, TTL expiry, eviction)
// ============================================================================
export type TlsSessionResumptionOutcome = 'resumed' | 'rejected' | 'uncached'

const tlsSessionResumptionMetrics = {
  resumed: { count: 0, attributes: { outcome: 'resumed' } },
  rejected: { count: 0, attributes: { outcome: 'rejected' } },
  uncached: { count: 0, attributes: { outcome: 'uncached' } },
} satisfies Record<TlsSessionResumptionOutcome, ObservableCounterSeries>
const tlsSessionResumptionMetricStates = Object.values(tlsSessionResumptionMetrics)

const dbTlsSessionResumption = registerMetric('db_tls_session_resumption_total', 'counter', () =>
  meter.createObservableCounter('db_tls_session_resumption_total', {
    description: 'Total DB TLS handshakes by session resumption outcome',
  })
)

registerCounterSeriesObservation(dbTlsSessionResumption, tlsSessionResumptionMetricStates)

/** Records the resumption outcome of one DB TLS handshake. */
export function recordTlsSessionResumption(outcome: TlsSessionResumptionOutcome): void {
  incrementCounter(tlsSessionResumptionMetrics[outcome])
}

// ============================================================================
// Database Metrics
// ============================================================================
export const dbQueryPerformance = registerMetric(
  'database_query_performance_seconds',
  'histogram',
  () =>
    meter.createHistogram('database_query_performance_seconds', {
      description: 'Database query performance in seconds',
      unit: 's',
    })
)

export const dbConnectionAcquireTime = registerMetric(
  'db_connection_acquire_seconds',
  'histogram',
  () =>
    meter.createHistogram('db_connection_acquire_seconds', {
      description: 'Time taken to acquire a database connection from the pool in seconds',
      unit: 's',
    })
)

// ============================================================================
// Queue Metrics
// ============================================================================
export const queueJobSchedulingTime = registerMetric(
  'queue_job_scheduled_time_seconds',
  'histogram',
  () =>
    meter.createHistogram('queue_job_scheduled_time_seconds', {
      description: 'Time taken to schedule a job in the queue in seconds',
      unit: 's',
    })
)

export const queueJobScheduled = registerMetric('queue_job_scheduled', 'updowncounter', () =>
  meter.createUpDownCounter('queue_job_scheduled', {
    description: 'Current number of pending messages in the queue',
  })
)

export const queueJobCompleted = registerMetric('queue_job_completed', 'updowncounter', () =>
  meter.createUpDownCounter('queue_job_completed', {
    description: 'Current number of processed messages in the queue',
  })
)

export const queueJobCompleteFailed = registerMetric(
  'queue_job_complete_failed',
  'updowncounter',
  () =>
    meter.createUpDownCounter('queue_job_complete_failed', {
      description: 'Current number of processed messages that could not be marked as completed',
    })
)

export const queueJobRetryFailed = registerMetric('queue_job_retry_failed', 'updowncounter', () =>
  meter.createUpDownCounter('queue_job_retry_failed', {
    description: 'Current number of failed attempts messages in the queue',
  })
)

export const queueJobError = registerMetric('queue_job_error', 'updowncounter', () =>
  meter.createUpDownCounter('queue_job_error', {
    description: 'Current number of errored messages in the queue',
  })
)

// ============================================================================
// S3 Metrics
// ============================================================================
export const s3UploadPart = registerMetric('s3_upload_part_seconds', 'histogram', () =>
  meter.createHistogram('s3_upload_part_seconds', {
    description: 'S3 upload part performance in seconds',
    unit: 's',
  })
)

// ============================================================================
// HTTP Pool Metrics
// ============================================================================
export const httpPoolBusySockets = registerMetric('http_pool_busy_sockets', 'gauge', () =>
  meter.createGauge('http_pool_busy_sockets', {
    description: 'Number of busy sockets currently in use',
  })
)

export const httpPoolFreeSockets = registerMetric('http_pool_free_sockets', 'gauge', () =>
  meter.createGauge('http_pool_free_sockets', {
    description: 'Number of free sockets available for reuse',
  })
)

export const httpPoolPendingRequests = registerMetric('http_pool_requests', 'gauge', () =>
  meter.createGauge('http_pool_requests', {
    description: 'Number of pending requests waiting for a socket',
  })
)

export const httpPoolErrors = registerMetric('http_pool_errors', 'gauge', () =>
  meter.createGauge('http_pool_errors', {
    description: 'Number of socket errors',
  })
)

// ============================================================================
// Database Pool Metrics (observable — collected only at export time)
// ============================================================================
export const dbActivePool = registerMetric('db_active_local_pools', 'gauge', () =>
  meter.createObservableGauge('db_active_local_pools', {
    description: 'Number of database pools created',
  })
)

export const dbActiveConnection = registerMetric('db_connections', 'gauge', () =>
  meter.createObservableGauge('db_connections', {
    description: 'Number of database connections in the pool',
  })
)

export const dbInUseConnection = registerMetric('db_connections_in_use', 'gauge', () =>
  meter.createObservableGauge('db_connections_in_use', {
    description: 'Number of database connections currently in use',
  })
)

export const dbPoolsPendingRetirement = registerMetric('db_pools_pending_retirement', 'gauge', () =>
  meter.createObservableGauge('db_pools_pending_retirement', {
    description:
      'Number of capacity-evicted database pool strategies whose retirement has not completed',
  })
)

export const dbPoolOldestPendingRetirementAge = registerMetric(
  'db_pool_oldest_pending_retirement_age_seconds',
  'gauge',
  () =>
    meter.createObservableGauge('db_pool_oldest_pending_retirement_age_seconds', {
      description:
        'Age of the oldest capacity-evicted database pool strategy whose retirement has not completed',
      unit: 's',
    })
)
