import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { createElement, useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useUnifiedLogsInfiniteQuery } from './unified-logs-infinite-query'
import { mergeUnifiedLogs, useUnifiedLogsLiveQuery } from './unified-logs-live-query'
import { compareRows, createRow, mockLogs, now, search } from './unified-logs.test-utils'
import { mapUnifiedLogRow, parseUnifiedLogsQueryRows } from './unified-logs.utils'
import { customRender, customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(now)
})
afterEach(() => vi.useRealTimers())

const burst = () =>
  Array.from({ length: 120 }, (_, index) =>
    createRow(
      `log-${String(index).padStart(3, '0')}`,
      `2026-09-30T11:59:59.000000${String(index).padStart(3, '0')}`
    )
  )

const failLogs = () =>
  addAPIMock({
    method: 'post',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
    response: () => HttpResponse.json<APIErrorBody>({ message: 'Unavailable' }, { status: 503 }),
  })

describe('bounded live logs', () => {
  it('starts from ready history when a child immediately polls after initial loading', async () => {
    mockLogs(burst(), true)
    function Poll({ onPoll }: { onPoll: () => Promise<{ isCatchingUp: boolean }> }) {
      useEffect(() => {
        void onPoll()
      }, [onPoll])
      return null
    }
    function Logs() {
      const history = useUnifiedLogsInfiniteQuery({ projectRef: 'default', search })
      const live = useUnifiedLogsLiveQuery({
        projectRef: 'default',
        search,
        isLive: true,
        seed: history.isSuccess ? history.data?.pages[0].prevCursor : undefined,
      })
      return createElement(
        'div',
        null,
        createElement(Poll, { onPoll: live.onPoll }),
        live.error ? live.error.message : String(live.data?.rows.length ?? 'Loading')
      )
    }
    customRender(createElement(Logs), { queryClient: new QueryClient() })
    expect(await screen.findByText('0')).toBeVisible()
  })

  it('merges precise timestamps and equal-timestamp IDs while preserving refreshed values', () => {
    const rows = parseUnifiedLogsQueryRows([
      createRow('z-old', '2026-09-30T11:59:59.000000001'),
      createRow('a-new', '2026-09-30T11:59:59.000000002'),
      createRow('z-tie', '2026-09-30T11:59:59.000000002'),
      createRow('numeric', (now.getTime() - 1000) * 1000 + 1),
      createRow('whole', '2026-09-30T11:59:58Z'),
    ]).map(mapUnifiedLogRow)
    const displayed = mergeUnifiedLogs([{ ...rows[3], event_message: 'Updated' }, ...rows])
    expect(displayed.map((row) => row.id)).toEqual(['numeric', 'z-tie', 'a-new', 'z-old', 'whole'])
    expect(displayed[0].event_message).toBe('Updated')
  })

  it('waits for history then publishes each ordered page without moving unfinished bounds', async () => {
    const rows = burst()
    const requests = mockLogs(rows, true)
    const queryClient = new QueryClient()
    let seed: number | undefined
    let selectedSearch = search
    const rendered = customRenderHook(
      () =>
        useUnifiedLogsLiveQuery({
          projectRef: 'default',
          search: selectedSearch,
          isLive: true,
          seed,
        }),
      { queryClient }
    )
    await act(async () => {
      await rendered.result.current.onPoll()
    })
    expect(requests).toHaveLength(0)
    seed = now.getTime() - 10_000
    rendered.rerender()
    for (let page = 1; page <= 3; page++) {
      await act(async () => {
        await Promise.all([rendered.result.current.onPoll(), rendered.result.current.onPoll()])
      })
      expect(requests).toHaveLength(page)
      await waitFor(() =>
        expect(rendered.result.current.data?.rows).toHaveLength(Math.min(page * 50, 120))
      )
      expect(rendered.result.current.data?.rows.map((row) => row.id)).toEqual(
        [...rows]
          .sort(compareRows)
          .slice(0, Math.min(page * 50, 120))
          .map((row) => row.id)
      )
      expect(rendered.result.current.isCatchingUp).toBe(page < 3)
      vi.setSystemTime(now.getTime() + page * 1000)
    }
    expect(
      requests.map(({ iso_timestamp_start, iso_timestamp_end }) => [
        iso_timestamp_start,
        iso_timestamp_end,
      ])
    ).toEqual(Array(3).fill(['2026-09-30T11:59:49.999Z', now.toISOString()]))
    selectedSearch = { ...search, filter: ['method:eq:GET'] }
    seed = undefined
    rendered.rerender()
    expect(rendered.result.current.data).toBeUndefined()
    await act(async () => {
      await rendered.result.current.onPoll()
    })
    expect(requests).toHaveLength(3)
  })

  it('finishes a 49-row window without another request and expires old accumulated rows', async () => {
    const requests = mockLogs(burst().slice(0, 49), true)
    const queryClient = new QueryClient()
    const { result } = customRenderHook(
      () =>
        useUnifiedLogsLiveQuery({
          projectRef: 'default',
          search,
          isLive: true,
          seed: now.getTime() - 2000,
        }),
      { queryClient }
    )
    let poll = { isCatchingUp: true }
    await act(async () => {
      poll = await result.current.onPoll()
    })
    expect(poll.isCatchingUp).toBe(false)
    await waitFor(() => expect(result.current.data?.rows).toHaveLength(49))
    vi.setSystemTime(now.getTime() + 60 * 60 * 1000)
    await act(async () => {
      await result.current.onPoll()
    })
    await waitFor(() => expect(result.current.data?.rows).toHaveLength(0))
    expect(requests).toHaveLength(2)
  })

  it('keeps committed pages through failed and canceled continuations, then resumes', async () => {
    const rows = burst()
    mockLogs(rows, true)
    const queryClient = new QueryClient()
    let isLive = true
    let selectedSearch = search
    const rendered = customRenderHook(
      () =>
        useUnifiedLogsLiveQuery({
          projectRef: 'default',
          search: selectedSearch,
          isLive,
          seed: now.getTime() - 2000,
        }),
      { queryClient }
    )
    await act(async () => {
      await rendered.result.current.onPoll()
    })
    await waitFor(() => expect(rendered.result.current.data?.rows).toHaveLength(50))
    const committed = rendered.result.current.data
    failLogs()
    await act(async () => {
      await rendered.result.current.onPoll()
    })
    await waitFor(() => expect(rendered.result.current.isError).toBe(true))
    expect(rendered.result.current.data).toBe(committed)
    const holdPage = (rows: ReturnType<typeof createRow>[]) => {
      const response = Promise.withResolvers<void>()
      const started = Promise.withResolvers<void>()
      addAPIMock({
        method: 'post',
        path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
        response: async () => {
          started.resolve()
          await response.promise
          return HttpResponse.json<platformComponents['schemas']['AnalyticsResponse_Output']>({
            result: rows,
          })
        },
      })
      return { response, started }
    }
    const unchanged = holdPage(rows.slice(20, 70).sort(compareRows))
    const unchangedPoll = rendered.result.current.onPoll()
    await act(async () => {
      await unchanged.started.promise
    })
    selectedSearch = { ...search }
    rendered.rerender()
    await act(async () => {
      unchanged.response.resolve()
      await unchangedPoll
    })
    await waitFor(() => expect(rendered.result.current.data?.rows).toHaveLength(100))
    const retained = rendered.result.current.data
    const { response, started } = holdPage([])
    let pending: ReturnType<typeof rendered.result.current.onPoll>
    await act(async () => {
      pending = rendered.result.current.onPoll()
      await started.promise
    })
    isLive = false
    rendered.rerender()
    await act(async () => {
      response.resolve()
      await pending
    })
    expect(rendered.result.current.data).toBe(retained)
    isLive = true
    rendered.rerender()
    mockLogs(rows, true)
    await act(async () => {
      await rendered.result.current.onPoll()
    })
    await waitFor(() => expect(rendered.result.current.data?.rows).toHaveLength(120))
  })

  it('retains live rows without changing history pagination or losing them on refresh', async () => {
    vi.setSystemTime(now.getTime() - 2000)
    const rows = Array.from({ length: 110 }, (_, index) =>
      createRow(`old-${index}`, (now.getTime() - 600_000 - index * 1000) * 1000)
    )
    mockLogs(rows, true)
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { result } = customRenderHook(
      () => {
        const history = useUnifiedLogsInfiniteQuery({ projectRef: 'default', search })
        const live = useUnifiedLogsLiveQuery({
          projectRef: 'default',
          search,
          isLive: true,
          seed: history.isSuccess ? history.data?.pages[0].prevCursor : undefined,
        })
        return { history, live }
      },
      { queryClient }
    )
    await waitFor(() => expect(result.current.history.isSuccess).toBe(true))
    await act(async () => {
      await result.current.history.fetchNextPage()
    })
    await waitFor(() => expect(result.current.history.data?.pages).toHaveLength(2))
    const history = result.current.history.data
    vi.setSystemTime(now)
    rows.push(...burst())
    await act(async () => {
      await result.current.live.onPoll()
    })
    await waitFor(() => expect(result.current.live.data?.rows).toHaveLength(50))
    failLogs()
    await act(async () => {
      await result.current.history.refetch()
    })
    await waitFor(() => expect(result.current.history.isError).toBe(true))
    mockLogs(rows, true)
    for (let page = 0; page < 2; page++) {
      await act(async () => {
        await result.current.live.onPoll()
      })
    }
    await waitFor(() => expect(result.current.live.data?.rows).toHaveLength(120))
    expect(result.current.history.data).toBe(history)
    await act(async () => {
      await result.current.history.refetch()
    })
    await waitFor(() =>
      expect(result.current.history.data?.pages[0].data.length).toBeGreaterThan(50)
    )
    expect(result.current.live.data?.rows).toHaveLength(120)
    const displayed = mergeUnifiedLogs([
      ...(result.current.history.data?.pages.flatMap((page) => page.data) ?? []),
      ...(result.current.live.data?.rows ?? []),
    ])
    expect(displayed).toHaveLength(220)
    expect(displayed.slice(0, 120).map((row) => row.id)).toEqual(
      [...burst()].sort(compareRows).map((row) => row.id)
    )
    await act(async () => {
      await result.current.history.fetchNextPage()
    })
    await waitFor(() =>
      expect(result.current.history.data?.pages.flatMap((page) => page.data)).toHaveLength(230)
    )
  })
})
