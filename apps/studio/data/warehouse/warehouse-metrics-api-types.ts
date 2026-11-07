/**
 * Temporary hand-written types for GET /platform/warehouse/{ref}/metrics (PIPE-1398).
 *
 * They mirror what the generated platform types will contain. Once packages/api-types includes
 * this endpoint, delete this file and use `components['schemas']['WarehouseMetricsResponse_Output']`.
 */

export type WarehouseMetricName =
  | 'activation_duration_mean'
  | 'activation_duration_p95'
  | 'activation_rate'
  | 'admission_rejection_rate'
  | 'assignment_wait_mean'
  | 'assignment_wait_p95'
  | 'duckdb_duration_mean'
  | 'query_canceled_rate'
  | 'query_duration_mean'
  | 'query_duration_p50'
  | 'query_duration_p95'
  | 'query_duration_p99'
  | 'query_error_rate'
  | 'query_in_flight'
  | 'query_rate'
  | 'query_timeout_rate'
  | 'rpc_duration_mean'
  | 'rpc_duration_p95'
  | 'rpc_rate'
  | 'worker_admission_active'
  | 'worker_admission_limit'
  | 'worker_admission_occupied'
  | 'worker_admission_pending'

export type WarehouseMetricsInterval = '1m' | '5m' | '10m' | '30m' | '1h' | '1d'

export type WarehouseMetricAvailability =
  | 'disabled'
  | 'insufficient_data'
  | 'no_data'
  | 'not_provisioned'
  | 'ok'
  | 'partial'
  | 'stale'
  | 'unavailable'

export type WarehouseMetric = {
  aggregation: 'mean' | 'occupied' | 'p50' | 'p95' | 'p99' | 'rate' | 'sum'
  availability: WarehouseMetricAvailability
  definition: string
  effective: {
    end: number
    rate_window_seconds: number
    start: number
    step: number
  }
  /** Latest observed source sample timestamp in Unix seconds; not the query evaluation timestamp. */
  last_sample_at: number | null
  metric: WarehouseMetricName
  project_ref: string
  requested: {
    end: number
    metric: WarehouseMetricName
    start: number
    step?: number
  }
  scrape_interval_seconds: number
  series: {
    /** Grid point coverage, not proof that every worker was scraped. */
    coverage: {
      expected_points: number
      returned_points: number
    }
    labels: {
      [key: string]: string
    }
    points: {
      /** Unix seconds */
      timestamp: number
      value: number | null
    }[]
  }[]
  unit: 'grants' | 'per_second' | 'queries' | 'seconds'
}

export type WarehouseMetricsResponse = {
  metrics: WarehouseMetric[]
}

declare module 'api-types' {
  interface paths {
    '/platform/warehouse/{ref}/metrics': {
      parameters: {
        query?: never
        header?: never
        path?: never
        cookie?: never
      }
      /** Get Warehouse metrics over a time range */
      get: {
        parameters: {
          query: {
            attribute?: WarehouseMetricName
            /** Up to 8 distinct measurements, as a comma-separated list or array. */
            attributes?: string | WarehouseMetricName[]
            /** No later than now; clock skew up to 60 seconds is clamped to server time. */
            endDate: string
            /** Defaults to 1m; effective step increases to stay within 1441 points per series. */
            interval?: WarehouseMetricsInterval
            /** Within the last 30 days; overruns up to 60 seconds are clamped for request delay. */
            startDate: string
          }
          header?: never
          path: {
            /** Project ref */
            ref: string
          }
          cookie?: never
        }
        requestBody?: never
        responses: {
          200: {
            headers: {
              [name: string]: unknown
            }
            content: {
              'application/json': WarehouseMetricsResponse
            }
          }
          /** Invalid attribute selection, batch size, range, interval or query parameter. */
          400: {
            headers: {
              [name: string]: unknown
            }
            content?: never
          }
          /** Unauthorized */
          401: {
            headers: {
              [name: string]: unknown
            }
            content?: never
          }
          /** Forbidden action */
          403: {
            headers: {
              [name: string]: unknown
            }
            content?: never
          }
          /** Project not found. */
          404: {
            headers: {
              [name: string]: unknown
            }
            content?: never
          }
          /** Rate limit exceeded */
          429: {
            headers: {
              [name: string]: unknown
            }
            content?: never
          }
          /** Warehouse feature unavailable, placement read failed, or query capacity exhausted. */
          503: {
            headers: {
              [name: string]: unknown
            }
            content?: never
          }
        }
      }
      put?: never
      post?: never
      delete?: never
      options?: never
      head?: never
      patch?: never
      trace?: never
    }
  }
}
