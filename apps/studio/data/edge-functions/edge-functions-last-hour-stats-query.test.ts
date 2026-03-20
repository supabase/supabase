import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { get } from 'data/fetchers'
import { getEdgeFunctionsLastHourStats } from './edge-functions-last-hour-stats-query'

vi.mock('data/fetchers', () => ({
  get: vi.fn(),
  handleError: vi.fn(),
}))

type GetResponse = Awaited<ReturnType<typeof get>>

describe('getEdgeFunctionsLastHourStats', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
    vi.mocked(get).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('requests last-hour function stats from logs.all', async () => {
    vi.mocked(get).mockResolvedValue({ data: { result: [] }, error: null } as GetResponse)

    await getEdgeFunctionsLastHourStats({ projectRef: 'project-ref' })

    expect(get).toHaveBeenCalledWith('/platform/projects/{ref}/analytics/endpoints/logs.all', {
      params: {
        path: { ref: 'project-ref' },
        query: {
          sql: expect.stringContaining('from\n  function_edge_logs'),
          iso_timestamp_start: '2024-01-15T11:00:00.000Z',
          iso_timestamp_end: '2024-01-15T12:00:00.000Z',
        },
      },
      signal: undefined,
    })
  })

  it('coerces counts to numbers and computes error rates per function', async () => {
    vi.mocked(get).mockResolvedValue({
      data: {
        result: [
          { function_id: 'fn_1', requests_count: '100', server_err_count: '5' },
          { function_id: 'fn_2', requests_count: 8, server_err_count: 0 },
        ],
      },
      error: null,
    } as GetResponse)

    const result = await getEdgeFunctionsLastHourStats({ projectRef: 'project-ref' })

    expect(result).toEqual({
      fn_1: {
        functionId: 'fn_1',
        requestsCount: 100,
        serverErrorCount: 5,
        errorRate: 5,
      },
      fn_2: {
        functionId: 'fn_2',
        requestsCount: 8,
        serverErrorCount: 0,
        errorRate: 0,
      },
    })
  })

  it('handles empty results', async () => {
    vi.mocked(get).mockResolvedValue({ data: { result: [] }, error: null } as GetResponse)

    const result = await getEdgeFunctionsLastHourStats({ projectRef: 'project-ref' })

    expect(result).toEqual({})
  })
})
