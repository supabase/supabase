import { HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getUnifiedLogs } from './unified-logs-infinite-query'
import { deduplicateUnifiedLogs } from './unified-logs.utils'
import { addAPIMock } from '@/tests/lib/msw'

const now = new Date('2026-09-30T12:00:00.000Z')

const createRow = (id: string, timestamp = now.getTime() * 1000) => ({
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

type RequestBody = { iso_timestamp_start: string; iso_timestamp_end: string; sql: string }

const isRequestBody = (value: unknown): value is RequestBody => {
  if (typeof value !== 'object' || value === null) return false
  const body = value as Record<string, unknown>
  return (
    typeof body.iso_timestamp_start === 'string' &&
    typeof body.iso_timestamp_end === 'string' &&
    typeof body.sql === 'string'
  )
}

const mockLogs = (rows: ReturnType<typeof createRow>[], useOtel = false) => {
  const requests: RequestBody[] = []
  addAPIMock({
    method: 'post',
    path: useOtel
      ? '/platform/projects/:ref/analytics/endpoints/logs.all.otel'
      : '/platform/projects/:ref/analytics/endpoints/logs.all',
    response: async ({ request }) => {
      const body = await request.json()
      if (!isRequestBody(body)) return new HttpResponse(null, { status: 400 })
      requests.push(body)
      const offset = Number(body.sql.match(/OFFSET (\d+)/)?.[1] ?? 0)
      const start = Date.parse(body.iso_timestamp_start) * 1000
      const end = Date.parse(body.iso_timestamp_end) * 1000
      return HttpResponse.json({
        result: rows
          .filter((row) => row.timestamp >= start && row.timestamp <= end)
          .slice(offset, offset + 50),
      })
    },
  })
  return requests
}

const getLiveLogs = (cursor: number) =>
  getUnifiedLogs({
    projectRef: 'default',
    search: {},
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

    expect(response.data.map((row) => row.id)).toEqual(rows.map((row) => row.id))
    expect(requests.map(({ sql }) => sql.match(/OFFSET (\d+)/)?.[1])).toEqual(['0', '50'])
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
      search: { date: [start, end] },
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
      search: {},
      pageParam: { cursor: now.getTime(), direction: 'prev' },
      useOtel: true,
    })

    expect(response.data.map((row) => row.id)).toEqual(['otel-log'])
    expect(requests[0].sql).toContain('LIMIT 50 OFFSET 0')
  })

  it('removes overlap duplicates before rendering rows', () => {
    expect(deduplicateUnifiedLogs([{ id: 'a' }, { id: 'b' }, { id: 'a' }])).toEqual([
      { id: 'a' },
      { id: 'b' },
    ])
  })
})
