import { QueryClient } from '@tanstack/react-query'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { warehouseKeys } from './keys'
import type { WarehouseMetricName, WarehouseMetricsResponse } from './warehouse-metrics-api-types'
import { createWarehouseMetricsDemo } from './warehouse-metrics-demo'
import {
  shouldRetryWarehouseMetrics,
  warehouseMetricsQueryOptions,
} from './warehouse-metrics-query'
import { createWarehouseMetricsResponse } from '@/components/interfaces/Observability/Warehouse/WarehouseMetrics.fixtures'
import { PlatformError, UnclassifiedApiError } from '@/lib/errors/studio-errors'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const variables = {
  projectRef: 'default',
  attributes: ['query_rate', 'query_duration_p95'] satisfies WarehouseMetricName[],
  startDate: '2026-11-05T11:00:00.000Z',
  endDate: '2026-11-05T12:00:00.000Z',
  interval: '1m' as const,
}

const newQueryClient = () => new QueryClient({ defaultOptions: { queries: { retry: false } } })

describe('shouldRetryWarehouseMetrics', () => {
  const error = (code: number) => new PlatformError({ message: 'failed', code })

  test.each([
    [0, 503, true],
    [1, 503, true],
    [2, 503, false],
    [0, 429, true],
    [1, 429, true],
    [2, 429, false],
    [0, 500, false],
    [0, 400, false],
    [0, 403, false],
    [0, 404, false],
  ])('failure %i with status %i retries: %s', (failureCount, code, expected) => {
    expect(shouldRetryWarehouseMetrics(failureCount, error(code))).toBe(expected)
  })

  test('does not retry an error without a status', () => {
    expect(shouldRetryWarehouseMetrics(0, new UnclassifiedApiError({ message: 'failed' }))).toBe(
      false
    )
  })
})

describe('warehouseMetricsQueryOptions', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  test('is keyed by project and request parameters', () => {
    const { projectRef, ...params } = variables
    expect(warehouseMetricsQueryOptions(variables).queryKey).toEqual(
      warehouseKeys.metrics(projectRef, params)
    )
    expect(warehouseKeys.metrics(projectRef, params).slice(0, 4)).toEqual(
      warehouseKeys.metricsAll(projectRef)
    )
  })

  test.each([
    ['there is no project ref', { ...variables, projectRef: undefined }, false],
    ['no attributes are requested', { ...variables, attributes: [] }, false],
    [
      'more than 8 attributes are requested',
      {
        ...variables,
        attributes: [
          'activation_duration_mean',
          'activation_duration_p95',
          'activation_rate',
          'admission_rejection_rate',
          'assignment_wait_mean',
          'assignment_wait_p95',
          'duckdb_duration_mean',
          'query_canceled_rate',
          'query_duration_mean',
        ] satisfies WarehouseMetricName[],
      },
      false,
    ],
    ['the request is valid', variables, true],
  ])('is enabled only when valid: %s', async (_name, vars, expected) => {
    // IS_PLATFORM is read when the module loads, so load a fresh copy on the platform
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'true')
    vi.resetModules()
    const platform = await import('./warehouse-metrics-query')
    expect(platform.warehouseMetricsQueryOptions(vars).enabled).toBe(expected)
  })

  test('is disabled outside the platform', async () => {
    vi.stubEnv('NEXT_PUBLIC_IS_PLATFORM', 'false')
    vi.resetModules()
    const selfHosted = await import('./warehouse-metrics-query')
    expect(selfHosted.warehouseMetricsQueryOptions(variables).enabled).toBe(false)
  })

  test('development demo respects the range and refreshes without a metrics request', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    let requests = 0
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/metrics',
      response: () => {
        requests++
        return HttpResponse.json<WarehouseMetricsResponse>({ metrics: [] })
      },
    })
    const client = newQueryClient()
    const options = warehouseMetricsQueryOptions({ ...variables, isDemo: true })
    const data = await client.fetchQuery(options)
    expect(options.queryKey).not.toEqual(warehouseMetricsQueryOptions(variables).queryKey)
    expect(data.metrics[0].series[0].points).toHaveLength(61)
    expect(data.metrics[0].series[0].points[0].timestamp).toBe(1793876400)
    expect(
      new Set(data.metrics[0].series[0].points.map(({ value }) => value)).size
    ).toBeGreaterThan(30)
    await client.invalidateQueries({ queryKey: warehouseKeys.metricsAll(variables.projectRef) })
    expect(await client.fetchQuery(options)).toEqual(data)
    expect(requests).toBe(0)
  })

  test('production ignores the demo opt-in and still requests live metrics', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/metrics',
      response: () => HttpResponse.json<WarehouseMetricsResponse>({ metrics: [] }),
    })
    const options = warehouseMetricsQueryOptions({ ...variables, isDemo: true })
    expect(options.queryKey).toEqual(warehouseMetricsQueryOptions(variables).queryKey)
    expect(await newQueryClient().fetchQuery(options)).toEqual({ metrics: [] })
  })

  test('sends the attributes, interval, and date range to the API', async () => {
    let search: URLSearchParams | undefined
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/metrics',
      response: ({ request }) => {
        search = new URL(request.url).searchParams
        return HttpResponse.json<WarehouseMetricsResponse>(
          createWarehouseMetricsResponse(variables.attributes)
        )
      },
    })

    const data = await newQueryClient().fetchQuery(warehouseMetricsQueryOptions(variables))

    expect(data.metrics.map((metric) => metric.metric)).toEqual(variables.attributes)
    expect(search?.get('attributes')).toBe('query_rate,query_duration_p95')
    expect(search?.get('interval')).toBe('1m')
    expect(search?.get('startDate')).toBe(variables.startDate)
    expect(search?.get('endDate')).toBe(variables.endDate)
  })

  test('rejects with the HTTP status so the retry policy can read it', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/warehouse/:ref/metrics',
      response: () => HttpResponse.json<APIErrorBody>({ message: 'Boom' }, { status: 500 }),
    })

    await expect(
      newQueryClient().fetchQuery(warehouseMetricsQueryOptions(variables))
    ).rejects.toMatchObject({ code: 500, message: 'Boom' })
  })
})

describe('Warehouse metrics development workload', () => {
  test('keeps monthly ranges bounded and retains the selected project', () => {
    const { metrics } = createWarehouseMetricsDemo({
      ...variables,
      projectRef: 'design-project',
      startDate: '2026-10-06T12:00:00.000Z',
      interval: '1m',
    })
    expect(metrics[0].project_ref).toBe('design-project')
    expect(metrics[0].series[0].points).toHaveLength(1441)
    expect(metrics[0].effective.step).toBe(1800)
    expect(metrics[0].series[0].points.at(-1)?.timestamp).toBe(Date.parse(variables.endDate) / 1000)
  })

  test('keeps duration percentiles ordered during the same workload', () => {
    const { metrics } = createWarehouseMetricsDemo({
      ...variables,
      attributes: ['query_duration_p50', 'query_duration_p95', 'query_duration_p99'],
    })
    const [p50, p95, p99] = metrics.map((metric) => metric.series[0].points)
    p50.forEach((point, index) => {
      expect(point.value).toBeLessThan(p95[index].value!)
      expect(p95[index].value).toBeLessThan(p99[index].value!)
    })
  })
})
