import { describe, expect, it } from 'vitest'

import {
  MAX_GROUPS_PER_VISIT,
  summarizeMutations,
  summarizeQueries,
  summarizeRequests,
  type RequestRecord,
} from './route-visit-summary.utils'

const request = (
  startMs: number,
  endMs: number,
  overrides: Partial<RequestRecord> = {}
): RequestRecord => ({ endpoint: 'GET /platform/a', startMs, endMs, isError: false, ...overrides })

describe('summarizeRequests', () => {
  it('reports zeros when there were no requests', () => {
    expect(summarizeRequests([])).toEqual({
      requestCount: 0,
      requestErrorCount: 0,
      requestSumMs: 0,
      requestBusyMs: 0,
      requestSpanMs: 0,
      maxConcurrentRequests: 0,
      singleFlightMs: 0,
      endpoints: [],
      otherEndpointRequestCount: 0,
    })
  })

  it('treats back-to-back requests as a fully serialized waterfall', () => {
    // 0-100 then 100-250: one request in flight the whole time, no overlap at the boundary
    const summary = summarizeRequests([request(0, 100), request(100, 250)])

    expect(summary).toMatchObject({
      requestCount: 2,
      requestSumMs: 250,
      requestBusyMs: 250,
      requestSpanMs: 250,
      maxConcurrentRequests: 1,
      singleFlightMs: 250,
    })
  })

  it('treats identical parallel requests as no waterfall at all', () => {
    const summary = summarizeRequests([request(0, 100), request(0, 100), request(0, 100)])

    expect(summary).toMatchObject({
      requestSumMs: 300,
      requestBusyMs: 100,
      requestSpanMs: 100,
      maxConcurrentRequests: 3,
      singleFlightMs: 0,
    })
  })

  it('separates overlapping work from idle gaps and lone requests', () => {
    // 0-100 and 50-150 overlap for 50ms, then idle until 300-340.
    // In flight: 0-150 and 300-340 = 190ms. Alone: 0-50, 100-150 and 300-340 = 140ms.
    const summary = summarizeRequests([request(0, 100), request(50, 150), request(300, 340)])

    expect(summary).toMatchObject({
      requestSumMs: 240,
      requestBusyMs: 190,
      requestSpanMs: 340,
      maxConcurrentRequests: 2,
      singleFlightMs: 140,
    })
  })

  it('counts a request that finished instantly as having been in flight', () => {
    expect(summarizeRequests([request(10, 10)])).toMatchObject({
      requestCount: 1,
      requestBusyMs: 0,
      requestSpanMs: 0,
      maxConcurrentRequests: 1,
    })
  })

  it('groups by endpoint with counts, errors, totals and the slowest call', () => {
    const summary = summarizeRequests([
      request(0, 100, { endpoint: 'GET /platform/a' }),
      request(0, 300, { endpoint: 'GET /platform/a', isError: true }),
      request(0, 50, { endpoint: 'POST /platform/b' }),
    ])

    expect(summary.requestErrorCount).toBe(1)
    expect(summary.endpoints).toEqual([
      { endpoint: 'GET /platform/a', count: 2, errorCount: 1, totalMs: 400, maxMs: 300 },
      { endpoint: 'POST /platform/b', count: 1, errorCount: 0, totalMs: 50, maxMs: 50 },
    ])
  })

  it('keeps the busiest endpoints and counts the requests it dropped', () => {
    // Endpoint N takes N ms, so the two cheapest are the ones dropped
    const total = MAX_GROUPS_PER_VISIT + 2
    const records = Array.from({ length: total }, (_, index) =>
      request(0, index + 1, { endpoint: `GET /platform/e${index + 1}` })
    )

    const summary = summarizeRequests(records)

    expect(summary.requestCount).toBe(total)
    expect(summary.endpoints).toHaveLength(MAX_GROUPS_PER_VISIT)
    expect(summary.endpoints[0].endpoint).toBe(`GET /platform/e${total}`)
    expect(summary.endpoints.map((group) => group.endpoint)).not.toContain('GET /platform/e1')
    expect(summary.otherEndpointRequestCount).toBe(2)
  })
})

describe('summarizeQueries', () => {
  it('groups by label and counts background refetches and errors', () => {
    const summary = summarizeQueries([
      { label: 'projects/tables', durationMs: 120, isError: false, isBackgroundRefetch: false },
      { label: 'projects/tables', durationMs: 80, isError: true, isBackgroundRefetch: true },
      { label: 'profile', durationMs: 40, isError: false, isBackgroundRefetch: false },
    ])

    expect(summary).toEqual({
      queryFetchCount: 3,
      queryErrorCount: 1,
      queryBackgroundRefetchCount: 1,
      querySumMs: 240,
      queries: [
        { label: 'projects/tables', count: 2, errorCount: 1, totalMs: 200, maxMs: 120 },
        { label: 'profile', count: 1, errorCount: 0, totalMs: 40, maxMs: 40 },
      ],
      otherQueryFetchCount: 0,
    })
  })

  it('counts the fetches of labels dropped by the cap', () => {
    const records = Array.from({ length: MAX_GROUPS_PER_VISIT + 3 }, (_, index) => ({
      label: `label-${index}`,
      durationMs: index + 1,
      isError: false,
      isBackgroundRefetch: false,
    }))

    const summary = summarizeQueries(records)

    expect(summary.queries).toHaveLength(MAX_GROUPS_PER_VISIT)
    expect(summary.otherQueryFetchCount).toBe(3)
  })
})

describe('summarizeMutations', () => {
  it('totals counts, errors and time', () => {
    expect(
      summarizeMutations([
        { durationMs: 100, isError: false },
        { durationMs: 250, isError: true },
      ])
    ).toEqual({ mutationCount: 2, mutationErrorCount: 1, mutationSumMs: 350 })
  })
})
