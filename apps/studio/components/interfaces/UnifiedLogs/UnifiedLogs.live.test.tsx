import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { platformComponents } from 'api-types'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi, mockResizeObserver } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { UnifiedLogs } from './UnifiedLogs'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()
mockResizeObserver()

vi.mock('@/components/ui/DataTable/TimelineChart', () => ({ TimelineChart: () => null }))
vi.mock('./ServiceFlowPanel', () => ({ ServiceFlowPanel: () => null }))
vi.mock('./components/LogsListPanel', () => ({ LogsListPanel: () => null }))
vi.mock('./components/DownloadLogsButton', () => ({ DownloadLogsButton: () => null }))
vi.mock('./components/LogsFilterBar', () => ({ LogsFilterBar: () => null }))
vi.mock('@/components/ui/DataTable/FilterSideBar', () => ({
  FilterSideBar: () => {
    const { table, getFacetedUniqueValues } = useDataTable()
    const count = getFacetedUniqueValues?.(table, 'log_type').get('postgres')
    return <output aria-label="Postgres facet">{count}</output>
  },
}))

const requestSchema = z.object({
  sql: z.string(),
  iso_timestamp_start: z.string(),
  iso_timestamp_end: z.string(),
})

const createRow = (id: string) => ({
  id,
  timestamp: (Date.now() - 1000) * 1000,
  log_type: 'postgres',
  status: null,
  level: 'success',
  pathname: null,
  event_message: id,
  method: null,
  log_count: null,
  logs: null,
})

afterEach(() => vi.useRealTimers())

const getLogSequence = () =>
  screen.getAllByRole('row').flatMap((row) => {
    if (row.hasAttribute('aria-selected')) return [row.id]
    if (row.textContent?.match(/^Refresh \d{2}:\d{2}:\d{2}$/)) return ['refresh']
    return []
  })

describe('UnifiedLogs Live counts and arrival batches', () => {
  it.each([false, true])(
    'refreshes totals and facets without counting overlap twice and pauses with otel=%s',
    async (useOtel) => {
      const rows = [createRow('initial-log')]
      const requests: Array<z.infer<typeof requestSchema>> = []
      addAPIMock({
        method: 'post',
        path: useOtel
          ? '/platform/projects/:ref/analytics/endpoints/logs.all.otel'
          : '/platform/projects/:ref/analytics/endpoints/logs.all',
        response: async ({ request }) => {
          const body = requestSchema.parse(await request.json())
          requests.push(body)
          let result: platformComponents['schemas']['AnalyticsResponse_Output']['result']
          if (body.sql.includes('AS facet') || body.sql.includes('log_type_counts')) {
            const facetColumn = useOtel
              ? 'facet'
              : z.enum(['facet', 'dimension']).parse(body.sql.match(/SELECT 'total' AS (\w+)/)?.[1])
            result = [
              { [facetColumn]: 'total', value: 'all', count: rows.length },
              { [facetColumn]: 'log_type', value: 'postgres', count: rows.length },
            ]
          } else if (body.sql.includes('time_bucket')) {
            result = []
          } else {
            result = rows.filter(
              (row) => row.timestamp > Date.parse(body.iso_timestamp_start) * 1000
            )
          }
          return HttpResponse.json<platformComponents['schemas']['AnalyticsResponse_Output']>({
            result,
          })
        },
      })
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const { unmount } = customRender(
        <FeatureFlagContext.Provider
          value={{ configcat: { otelUnifiedLogs: useOtel }, posthog: {}, hasLoaded: true }}
        >
          <UnifiedLogs />
        </FeatureFlagContext.Provider>,
        { queryClient, nuqs: { hasMemory: true } }
      )
      await waitFor(() => expect(screen.getByLabelText('Postgres facet')).toHaveTextContent('1'))
      expect(screen.getByText('initial-log')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /new logs?/ })).not.toBeInTheDocument()

      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      rows.push(createRow('first-arrival'), {
        ...createRow('late-arrival'),
        timestamp: rows[0].timestamp - 30_000_000,
      })
      fireEvent.click(screen.getByRole('button', { name: 'Live' }))
      await vi.waitFor(() => {
        expect(screen.getByLabelText('Postgres facet')).toHaveTextContent('3')
        expect(screen.getByText('first-arrival')).toBeInTheDocument()
        expect(screen.getByText(/No more data to load/)).toHaveTextContent('3 of 3 rows')
      })
      expect(getLogSequence()).toEqual(['first-arrival', 'late-arrival', 'refresh', 'initial-log'])
      expect(screen.getByRole('button', { name: '2 new logs' })).toBeVisible()
      const separator = screen.getByText(/^Refresh \d{2}:\d{2}:\d{2}$/)
      expect(separator).toHaveAttribute(
        'colspan',
        String(screen.getAllByRole('columnheader').length)
      )
      expect(separator.closest('tr')).not.toHaveAttribute('tabindex')
      fireEvent.click(separator)
      expect(
        screen.getAllByRole('row').filter((row) => row.getAttribute('aria-selected') === 'true')
      ).toHaveLength(0)
      await act(async () => {})

      rows.push(createRow('second-arrival'))
      await act(async () => vi.advanceTimersByTimeAsync(10_000))
      await vi.waitFor(() => {
        expect(screen.getByLabelText('Postgres facet')).toHaveTextContent('4')
        expect(screen.getByText('second-arrival')).toBeInTheDocument()
        expect(screen.getByText(/No more data to load/)).toHaveTextContent('4 of 4 rows')
      })
      expect(getLogSequence()).toEqual([
        'second-arrival',
        'refresh',
        'first-arrival',
        'late-arrival',
        'refresh',
        'initial-log',
      ])
      expect(screen.getAllByText('initial-log')).toHaveLength(1)
      expect(screen.getAllByText('first-arrival')).toHaveLength(1)
      expect(screen.getByRole('button', { name: '3 new logs' })).toBeVisible()
      expect(requests).toHaveLength(7)

      await act(async () => vi.advanceTimersByTimeAsync(10_000))
      await vi.waitFor(() => expect(requests).toHaveLength(9))
      expect(screen.getAllByText(/^Refresh \d{2}:\d{2}:\d{2}$/)).toHaveLength(2)
      expect(screen.getByRole('button', { name: '3 new logs' })).toBeVisible()

      fireEvent.click(screen.getByRole('button', { name: 'Live' }))
      const requestsAfterPause = requests.length
      rows.push(createRow('paused-arrival'))
      await act(async () => vi.advanceTimersByTimeAsync(30_000))
      expect(requests).toHaveLength(requestsAfterPause)
      expect(screen.queryByText('paused-arrival')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Postgres facet')).toHaveTextContent('4')
      expect(screen.getAllByText(/^Refresh \d{2}:\d{2}:\d{2}$/)).toHaveLength(2)
      fireEvent.click(screen.getByRole('button', { name: '3 new logs' }))
      expect(screen.queryByRole('button', { name: /new logs?/ })).not.toBeInTheDocument()
      expect(screen.getAllByText(/^Refresh \d{2}:\d{2}:\d{2}$/)).toHaveLength(2)

      fireEvent.click(screen.getByRole('button', { name: 'Live' }))
      await vi.waitFor(() => expect(screen.getByText('paused-arrival')).toBeInTheDocument())
      expect(screen.getByRole('button', { name: '1 new log' })).toBeVisible()
      expect(getLogSequence()).toEqual([
        'paused-arrival',
        'refresh',
        'second-arrival',
        'refresh',
        'first-arrival',
        'late-arrival',
        'refresh',
        'initial-log',
      ])
      await vi.waitFor(() =>
        expect(screen.getByRole('button', { name: 'Refresh logs' })).toBeEnabled()
      )
      fireEvent.click(screen.getByRole('button', { name: 'Refresh logs' }))
      expect(screen.queryByRole('button', { name: /new logs?/ })).not.toBeInTheDocument()
      expect(screen.queryByText(/^Refresh \d{2}:\d{2}:\d{2}$/)).not.toBeInTheDocument()
      unmount()
    }
  )
})
