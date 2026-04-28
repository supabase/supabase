import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getEdgeFunctionsLastHourStats } from './edge-functions-last-hour-stats-query'
import { post } from '@/data/fetchers'

vi.mock('@/data/fetchers', () => ({
  post: vi.fn(),
  handleError: vi.fn(),
}))

type PostResponse = Awaited<ReturnType<typeof post>>

describe('getEdgeFunctionsLastHourStats', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00.000Z'))
    vi.mocked(post).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('requests last-hour function stats from logs.all', async () => {
    vi.mocked(post).mockResolvedValue({ data: { result: [] }, error: null } as PostResponse)

    await getEdgeFunctionsLastHourStats({
      projectRef: 'project-ref',
      functionIds: ['fn_1', 'fn_2'],
    })

    expect(post).toHaveBeenCalledWith('/platform/projects/{ref}/analytics/endpoints/logs.all', {
      params: {
        path: { ref: 'project-ref' },
        query: { key: 'last-hour-stats' },
      },
      body: expect.objectContaining({
        sql: expect.stringContaining(`and function_id in ('fn_1', 'fn_2')`),
        iso_timestamp_start: '2024-01-15T11:00:00.000Z',
        iso_timestamp_end: '2024-01-15T12:00:00.000Z',
      }),
      signal: undefined,
    })

    const postCalls = vi.mocked(post).mock.calls as Array<
      [string, { body?: { sql?: string } } | undefined]
    >

    expect(postCalls[0]?.[1]?.body?.sql).toContain('from\n  function_edge_logs')
  })

  it('coerces counts to numbers and computes error rates per function', async () => {
    vi.mocked(post).mockResolvedValue({
      data: {
        result: [
          { function_id: 'fn_1', requests_count: '100', server_err_count: '5' },
          { function_id: 'fn_2', requests_count: 8, server_err_count: 0 },
        ],
      },
      error: null,
    } as PostResponse)

    const result = await getEdgeFunctionsLastHourStats({
      projectRef: 'project-ref',
      functionIds: ['fn_1', 'fn_2'],
    })

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
    vi.mocked(post).mockResolvedValue({ data: { result: [] }, error: null } as PostResponse)

    const result = await getEdgeFunctionsLastHourStats({
      projectRef: 'project-ref',
      functionIds: ['fn_1'],
    })

    expect(result).toEqual({})
  })

  it('skips the logs query when there are no function ids', async () => {
    const result = await getEdgeFunctionsLastHourStats({
      projectRef: 'project-ref',
      functionIds: [],
    })

    expect(result).toEqual({})
    expect(post).not.toHaveBeenCalled()
  })
})
