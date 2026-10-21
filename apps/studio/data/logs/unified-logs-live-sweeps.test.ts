import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { useUnifiedLogsLiveQuery } from './unified-logs-live-query'
import { createRow, mockLogs, now, search } from './unified-logs.test-utils'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const burst = (prefix: string, timestamp: number) =>
  Array.from({ length: 120 }, (_, index) =>
    createRow(`${prefix}-${String(index).padStart(3, '0')}`, timestamp)
  )
const renderLive = (rows: ReturnType<typeof createRow>[]) => {
  const requests = mockLogs(rows, true)
  let isLive = true
  const rendered = customRenderHook(
    () =>
      useUnifiedLogsLiveQuery({
        projectRef: 'default',
        search,
        seed: now.getTime(),
        isLive,
      }),
    { queryClient: new QueryClient() }
  )
  const poll = async () => {
    let value = { isCatchingUp: false }
    await act(async () => {
      value = await rendered.result.current.onPoll()
    })
    return value
  }
  return {
    ...rendered,
    requests,
    poll,
    setLive(value: boolean) {
      isLive = value
      rendered.rerender()
    },
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(now)
})
afterEach(() => vi.useRealTimers())

describe('live overlap sweeps', () => {
  it('narrows forward requests, includes boundary precision, and sweeps from the previous completed endpoint', async () => {
    const rows = [
      createRow('before', '2026-09-30T11:59:59.999999999'),
      createRow('boundary', now.getTime() * 1000),
      createRow('after', '2026-09-30T12:00:00.000000001'),
    ]
    const live = renderLive(rows)
    for (const seconds of [10, 20, 30]) {
      vi.setSystemTime(now.getTime() + seconds * 1000)
      await live.poll()
    }
    await waitFor(() => expect(live.result.current.data?.rows).toHaveLength(3))
    rows.push(createRow('late', (now.getTime() + 5000) * 1000))
    vi.setSystemTime(now.getTime() + 5 * 60 * 1000)
    await live.poll()
    await live.poll()
    await waitFor(() =>
      expect(live.result.current.data?.rows.map((row) => row.id)).toContain('late')
    )
    expect(live.requests.map(({ iso_timestamp_start }) => iso_timestamp_start)).toEqual([
      '2026-09-30T11:59:59.999Z',
      '2026-09-30T12:00:09.999Z',
      '2026-09-30T11:57:59.999Z',
      '2026-09-30T12:00:19.999Z',
      '2026-09-30T11:58:29.999Z',
    ])
  })

  it('alternates unfinished streams and recovers arrivals above an already-passed cursor', async () => {
    const freshTimestamp = (now.getTime() + 1000) * 1000 + 123
    const rows = [
      ...burst('fresh', freshTimestamp),
      ...burst('old', (now.getTime() - 30_000) * 1000 + 123),
    ]
    const live = renderLive(rows)
    vi.setSystemTime(now.getTime() + 31_000)
    for (let request = 0; request < 6; request++) {
      await live.poll()
      expect(live.requests).toHaveLength(request + 1)
      if (request === 1) rows.push(createRow('zzz-late', freshTimestamp))
    }
    expect(live.requests.map(({ iso_timestamp_start }) => iso_timestamp_start)).toEqual(
      Array(3).fill(['2026-09-30T11:59:59.999Z', '2026-09-30T11:57:59.999Z']).flat()
    )
    await waitFor(() => expect(live.result.current.data?.rows).toHaveLength(150))
    vi.setSystemTime(now.getTime() + 32_000)
    rows.push(createRow('new', (now.getTime() + 32_000) * 1000))
    await live.poll()
    await waitFor(() => expect(live.result.current.data?.rows[0].id).toBe('new'))
    expect(live.result.current.isCatchingUp).toBe(true)
    for (let request = 0; request < 2; request++) await live.poll()
    await waitFor(() => expect(live.result.current.data?.rows).toHaveLength(241))
    vi.setSystemTime(now.getTime() + 61_000)
    for (let request = 0; request < 6; request++) await live.poll()
    await waitFor(() => expect(live.result.current.data?.rows).toHaveLength(242))
    expect(new Set(live.result.current.data?.rows.map((row) => row.id))).toEqual(
      new Set(rows.map((row) => row.id))
    )
  })

  it('preserves both stream cursors through errors and pause cancellation', async () => {
    const rows = [
      ...burst('fresh', (now.getTime() + 1000) * 1000),
      ...burst('old', (now.getTime() - 30_000) * 1000),
    ]
    const live = renderLive(rows)
    vi.setSystemTime(now.getTime() + 31_000)
    await live.poll()
    await live.poll()
    await waitFor(() => expect(live.result.current.data?.rows).toHaveLength(50))
    const committed = live.result.current.data
    let failures = 0
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: () => {
        failures++
        return HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 503 })
      },
    })
    await live.poll()
    expect(failures).toBe(1)
    expect(live.result.current.data).toBe(committed)
    mockLogs(rows, true)
    await live.poll()
    await live.poll()
    await waitFor(() => expect(live.result.current.data?.rows).toHaveLength(100))
    const retained = live.result.current.data
    const started = Promise.withResolvers<void>()
    const release = Promise.withResolvers<void>()
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async () => {
        started.resolve()
        await release.promise
        return HttpResponse.json<platformComponents['schemas']['AnalyticsResponse_Output']>({
          result: [],
        })
      },
    })
    const pending = live.result.current.onPoll()
    await act(async () => {
      await started.promise
    })
    live.setLive(false)
    await act(async () => {
      release.resolve()
      await pending
    })
    expect(live.result.current.data).toBe(retained)
    live.setLive(true)
    const requests = mockLogs(rows, true)
    await live.poll()
    await live.poll()
    expect(requests[1].iso_timestamp_start).toBe('2026-09-30T11:57:59.999Z')
    expect(requests[1].sql).toContain("toString(id) < 'fresh-020'")
    for (let request = 0; request < 2; request++) await live.poll()
    await waitFor(() => expect(live.result.current.data?.rows).toHaveLength(240))
  })

  it('keeps fresh records flowing through repeated sweep failures and resumes the failed cursor', async () => {
    const rows = [
      ...burst('fresh', (now.getTime() + 1000) * 1000),
      ...burst('old', (now.getTime() - 30_000) * 1000),
    ]
    const live = renderLive(rows)
    vi.setSystemTime(now.getTime() + 31_000)
    await live.poll()
    await live.poll()
    let failSweeps = true
    let failures = 0
    const bodySchema = z.object({ iso_timestamp_start: z.string(), iso_timestamp_end: z.string() })
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        const body = bodySchema.parse(await request.clone().json())
        const isSweep =
          Date.parse(body.iso_timestamp_end) - Date.parse(body.iso_timestamp_start) > 60_000
        if (isSweep && failSweeps) {
          failures++
          return HttpResponse.json<APIErrorBody>({ message: 'Sweep timed out' }, { status: 503 })
        }
      },
    })
    for (const seconds of [32, 33, 34]) {
      vi.setSystemTime(now.getTime() + seconds * 1000)
      rows.push(createRow(`new-${seconds}`, Date.now() * 1000))
      await live.poll()
      await live.poll()
    }
    expect(failures).toBe(3)
    await waitFor(() => expect(live.result.current.isError).toBe(true))
    expect(live.result.current.data?.rows.slice(0, 3).map((row) => row.id)).toEqual([
      'new-34',
      'new-33',
      'new-32',
    ])
    failSweeps = false
    await live.poll()
    expect(live.requests.at(-1)?.sql).toContain("toString(id) < 'fresh-070'")
    for (let request = 0; request < 3; request++) await live.poll()
    await waitFor(() => expect(live.result.current.data?.rows).toHaveLength(243))
  })
})
