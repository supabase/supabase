import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { createLoader } from 'nuqs/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { getUnifiedLogs, useUnifiedLogsInfiniteQuery } from './unified-logs-infinite-query'
import { deduplicateUnifiedLogs } from './unified-logs.utils'
import { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const now = new Date('2026-09-30T12:00:00.000Z')
const search = createLoader(SEARCH_PARAMS_PARSER)(new URLSearchParams())

const createRow = (id: string, timestamp: number | string = now.getTime() * 1000) => ({
  id,
  timestamp,
  log_type: 'edge',
  status: 200,
  level: 'success',
  pathname: '/',
  event_message: id,
  method: 'GET',
  log_count: null,
  logs: null,
})

const requestBodySchema = z.object({
  iso_timestamp_start: z.string(),
  iso_timestamp_end: z.string(),
  sql: z.string(),
})
type RequestBody = z.infer<typeof requestBodySchema>

const timestampToNanos = (timestamp: number | string) => {
  if (!/[T-]/.test(String(timestamp))) return BigInt(timestamp) * 1000n
  const fractionalNanos =
    String(timestamp)
      .match(/\.(\d+)/)?.[1]
      .padEnd(9, '0')
      .slice(3, 9) ?? '0'
  const isoTimestamp = String(timestamp).endsWith('Z') ? String(timestamp) : `${timestamp}Z`
  return BigInt(Date.parse(isoTimestamp)) * 1_000_000n + BigInt(fractionalNanos)
}

const compareRows = (a: ReturnType<typeof createRow>, b: ReturnType<typeof createRow>) => {
  const timestampA = timestampToNanos(a.timestamp)
  const timestampB = timestampToNanos(b.timestamp)
  if (timestampA !== timestampB) return timestampA > timestampB ? -1 : 1
  if (a.id === b.id) return 0
  return a.id > b.id ? -1 : 1
}

const mockLogs = (
  rows: ReturnType<typeof createRow>[],
  useOtel = false,
  onRequest?: (requestNumber: number) => void
) => {
  const requests: RequestBody[] = []
  addAPIMock({
    method: 'post',
    path: useOtel
      ? '/platform/projects/:ref/analytics/endpoints/logs.all.otel'
      : '/platform/projects/:ref/analytics/endpoints/logs.all',
    response: async ({ request }) => {
      const body = requestBodySchema.parse(await request.json())
      requests.push(body)
      onRequest?.(requests.length)
      const numericCursor = body.sql.match(
        /timestamp < (?:TIMESTAMP_MICROS|fromUnixTimestamp64Micro)\((\d+)\)/
      )?.[1]
      const isoCursor = body.sql.match(
        /timestamp < (?:CAST|parseDateTime64BestEffort)\('([^']+)'/
      )?.[1]
      const cursorTimestamp = numericCursor ?? isoCursor
      const cursorId = body.sql.match(/(?:id|toString\(id\)) < '([^']+)'/)?.[1]
      const start = timestampToNanos(body.iso_timestamp_start)
      const end = timestampToNanos(body.iso_timestamp_end)
      return HttpResponse.json<platformComponents['schemas']['AnalyticsResponse_Output']>({
        result: rows
          .filter((row) => {
            const timestamp = timestampToNanos(row.timestamp)
            if (timestamp <= start || timestamp > end) return false
            if (!cursorTimestamp || !cursorId) return true
            const cursor = timestampToNanos(cursorTimestamp)
            return timestamp < cursor || (timestamp === cursor && row.id < cursorId)
          })
          .sort(compareRows)
          .slice(0, 50),
      })
    },
  })
  return requests
}

const getLiveLogs = (cursor: number) =>
  getUnifiedLogs({
    projectRef: 'default',
    search,
    pageParam: { cursor, direction: 'prev' },
  })

afterEach(() => vi.useRealTimers())

describe('getUnifiedLogs live polling', () => {
  it('uses the previous poll time minus the overlap for successive polls', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const requests = mockLogs([])

    const firstPoll = await getLiveLogs(now.getTime())
    vi.setSystemTime(new Date('2026-09-30T12:00:10.000Z'))
    await getLiveLogs(firstPoll.prevCursor)

    expect(
      requests.map(({ iso_timestamp_start, iso_timestamp_end }) => ({
        iso_timestamp_start,
        iso_timestamp_end,
      }))
    ).toEqual([
      {
        iso_timestamp_start: '2026-09-30T11:58:00.000Z',
        iso_timestamp_end: '2026-09-30T12:00:00.000Z',
      },
      {
        iso_timestamp_start: '2026-09-30T11:58:00.000Z',
        iso_timestamp_end: '2026-09-30T12:00:10.000Z',
      },
    ])
  })

  it('drains equal-timestamp bursts across query pages', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const rows = Array.from({ length: 51 }, (_, index) => createRow(`log-${index}`))
    const requests = mockLogs(rows)

    const response = await getLiveLogs(now.getTime())

    expect(response.data.map((row) => row.id)).toEqual(
      [...rows].sort(compareRows).map((row) => row.id)
    )
    expect(requests).toHaveLength(2)
    expect(requests[1].sql).toContain('TIMESTAMP_MICROS(')
    expect(requests[1].sql).not.toContain('OFFSET')
  })

  it('includes records that arrive within the overlap', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-30T12:01:00.000Z'))
    mockLogs([
      createRow('late-log', new Date('2026-09-30T11:59:30.000Z').getTime() * 1000),
      createRow('expired-log', new Date('2026-09-30T11:57:59.999Z').getTime() * 1000),
    ])

    const response = await getLiveLogs(now.getTime())

    expect(response.data.map((row) => row.id)).toEqual(['late-log'])
  })

  it('keeps explicit date ranges unchanged', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-30T12:01:00.000Z'))
    const requests = mockLogs([])
    const start = new Date('2026-09-30T11:00:00.000Z')
    const end = new Date('2026-09-30T11:30:00.000Z')

    await getUnifiedLogs({
      projectRef: 'default',
      search: { ...search, date: [start, end] },
      pageParam: { cursor: now.getTime(), direction: 'prev' },
    })

    expect(requests[0]).toMatchObject({
      iso_timestamp_start: start.toISOString(),
      iso_timestamp_end: end.toISOString(),
    })
  })

  it('returns a poll watermark when no records are found', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    mockLogs([])

    const response = await getLiveLogs(now.getTime())

    expect(response).toMatchObject({ data: [], nextCursor: null, prevCursor: now.getTime() })
  })

  it('uses the same live pagination for the OTEL endpoint', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const requests = mockLogs([createRow('otel-log')], true)

    const response = await getUnifiedLogs({
      projectRef: 'default',
      search,
      pageParam: { cursor: now.getTime(), direction: 'prev' },
      useOtel: true,
    })

    expect(response.data.map((row) => row.id)).toEqual(['otel-log'])
    expect(requests[0].sql).toContain('ORDER BY timestamp DESC, toString(id) DESC LIMIT 50')
  })

  it('removes overlap duplicates before rendering rows', () => {
    expect(deduplicateUnifiedLogs([{ id: 'a' }, { id: 'b' }, { id: 'a' }])).toEqual([
      { id: 'a' },
      { id: 'b' },
    ])
  })

  it('refreshes the default range after an empty Live poll and retains older pagination', async () => {
    const timestamp = Date.now() - 10 * 60 * 1000
    const rows = Array.from({ length: 60 }, (_, index) =>
      createRow(`log-${index}`, (timestamp - index * 1000) * 1000)
    )
    const requests = mockLogs(rows)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = customRenderHook(
      () => useUnifiedLogsInfiniteQuery({ projectRef: 'default', search }),
      { queryClient }
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pages[0].data).toHaveLength(50)
    expect(result.current.hasNextPage).toBe(true)

    await act(async () => {
      const response = await result.current.fetchNextPage()
      expect(response.error).toBeNull()
    })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2))
    const idsBeforeLive = deduplicateUnifiedLogs(
      result.current.data?.pages.flatMap((page) => page.data) ?? []
    ).map((row) => row.id)
    await act(async () => {
      await result.current.fetchPreviousPage()
    })
    await waitFor(() => expect(result.current.data?.pages).toHaveLength(3))
    expect(result.current.data?.pages[0].data).toEqual([])

    await act(async () => {
      await result.current.refetch()
    })
    await waitFor(() => expect(result.current.data?.pages[0].data).toHaveLength(50))

    expect(
      deduplicateUnifiedLogs(result.current.data?.pages.flatMap((page) => page.data) ?? []).map(
        (row) => row.id
      )
    ).toEqual(idsBeforeLive)
    expect(
      Date.parse(requests[3].iso_timestamp_end) - Date.parse(requests[3].iso_timestamp_start)
    ).toBe(60 * 60 * 1000)
  })

  it.each([false, true])('handles arrivals between pages on backend otel=%s', async (useOtel) => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const timestamp = (now.getTime() - 1000) * 1000 + 123
    const rows = Array.from({ length: 120 }, (_, index) =>
      createRow(`log-${String(index).padStart(3, '0')}`, timestamp)
    )
    const originalIds = rows.map((row) => row.id)
    const requests = mockLogs(rows, useOtel, (requestNumber) => {
      if (requestNumber === 2) {
        rows.push(createRow('zzz-late', timestamp), createRow('aaa-late', timestamp))
      }
    })
    const variables = {
      projectRef: 'default',
      search,
      pageParam: { cursor: now.getTime(), direction: 'prev' as const },
      useOtel,
    }
    const firstPoll = await getUnifiedLogs(variables)
    expect(new Set(firstPoll.data.map((row) => row.id))).toEqual(
      new Set([...originalIds, 'aaa-late'])
    )
    expect(requests[1].sql).toContain(String(timestamp))
    const nextPoll = await getUnifiedLogs({
      ...variables,
      pageParam: { cursor: firstPoll.prevCursor, direction: 'prev' },
    })
    const displayed = deduplicateUnifiedLogs([...nextPoll.data, ...firstPoll.data])
    expect(displayed).toHaveLength(122)
    expect(new Set(displayed.map((row) => row.id))).toEqual(
      new Set([...originalIds, 'aaa-late', 'zzz-late'])
    )
  })

  it('preserves nanosecond ISO cursors on OTEL', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const rows = Array.from({ length: 51 }, (_, index) =>
      createRow(
        `log-${String(index).padStart(3, '0')}`,
        `2026-09-30T11:59:59.000000${String(index).padStart(3, '0')}`
      )
    )
    const requests = mockLogs(rows, true)
    const response = await getUnifiedLogs({
      projectRef: 'default',
      search,
      useOtel: true,
      pageParam: { cursor: now.getTime(), direction: 'prev' },
    })
    expect(response.data.map((row) => row.id)).toEqual(
      [...rows].sort(compareRows).map((row) => row.id)
    )
    expect(requests[1].sql).toContain(
      "parseDateTime64BestEffort('2026-09-30T11:59:59.000000001', 9, 'UTC')"
    )
  })
})
