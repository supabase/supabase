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

describe('UnifiedLogs Live counts', () => {
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

      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      rows.push(createRow('first-arrival'))
      fireEvent.click(screen.getByRole('button', { name: 'Live' }))
      await vi.waitFor(() => {
        expect(screen.getByLabelText('Postgres facet')).toHaveTextContent('2')
        expect(screen.getByText('first-arrival')).toBeInTheDocument()
        expect(screen.getByText(/No more data to load/)).toHaveTextContent('2 of 2 rows')
      })
      await act(async () => {})

      rows.push(createRow('second-arrival'))
      await act(async () => vi.advanceTimersByTimeAsync(10_000))
      await vi.waitFor(() => {
        expect(screen.getByLabelText('Postgres facet')).toHaveTextContent('3')
        expect(screen.getByText('second-arrival')).toBeInTheDocument()
        expect(screen.getByText(/No more data to load/)).toHaveTextContent('3 of 3 rows')
      })
      expect(screen.getAllByText('initial-log')).toHaveLength(1)
      expect(screen.getAllByText('first-arrival')).toHaveLength(1)
      expect(requests).toHaveLength(7)

      fireEvent.click(screen.getByRole('button', { name: 'Live' }))
      const requestsAfterPause = requests.length
      rows.push(createRow('paused-arrival'))
      await act(async () => vi.advanceTimersByTimeAsync(30_000))
      expect(requests).toHaveLength(requestsAfterPause)
      expect(screen.queryByText('paused-arrival')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Postgres facet')).toHaveTextContent('3')
      unmount()
    }
  )
})
