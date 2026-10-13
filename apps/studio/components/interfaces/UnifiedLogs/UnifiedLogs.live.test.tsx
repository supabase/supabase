import { QueryClient } from '@tanstack/react-query'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { platformComponents } from 'api-types'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi, mockResizeObserver } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { UnifiedLogs } from './UnifiedLogs'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

mockAnimationsApi()
mockResizeObserver()

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

describe('UnifiedLogs Live counts and arrival batches', () => {
  it.each([false, true])(
    'refreshes totals and facets without counting overlap twice and pauses with otel=%s',
    async (useOtel) => {
      const rows = [createRow('initial-log')]
      const requests: Array<z.infer<typeof requestSchema>> = []
      let pendingRefresh: Promise<void> | undefined
      addAPIMock({
        method: 'get',
        path: '/platform/projects/:ref',
        response: {
          id: 1,
          ref: 'default',
          organization_id: 1,
          name: 'Test project',
          status: 'ACTIVE_HEALTHY',
          cloud_provider: 'AWS',
          region: 'us-east-1',
          db_host: 'db.default.supabase.co',
          restUrl: 'https://default.supabase.co/rest/v1/',
          inserted_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          subscription_id: 'subscription-1',
          is_branch_enabled: false,
          is_physical_backups_enabled: false,
          high_availability: false,
          integration_source: null,
          connectionString: null,
        },
      })
      addAPIMock({
        method: 'post',
        path: '/platform/pg-meta/:ref/query',
        response: () => HttpResponse.json<[]>([]),
      })
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
            await pendingRefresh
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
      const waitForLiveUpdate = async (assertion: () => void) => {
        await act(async () => {
          await vi.waitFor(() => expect(queryClient.isFetching()).toBe(0))
          await vi.advanceTimersByTimeAsync(1)
        })
        assertion()
      }
      const { unmount } = customRender(
        <FeatureFlagContext.Provider
          value={{
            configcat: {
              otelUnifiedLogs: useOtel,
              compute: false,
              showMultigresLogs: false,
              platformWebhooks: false,
              jitDbAccess: false,
              marketplaceIntegrations: false,
              explorer: false,
              storageVersioningPrivateAlpha: false,
              sqlEditorManualSaveForced: false,
            },
            posthog: {},
            hasLoaded: true,
          }}
        >
          <style>{'.opacity-60 { opacity: 0.6; }'}</style>
          <UnifiedLogs />
        </FeatureFlagContext.Provider>,
        { queryClient, nuqs: { hasMemory: true } }
      )
      await waitFor(() =>
        expect(screen.getByRole('checkbox', { name: /^Postgres/ })).toHaveAccessibleName(/\b1\b/)
      )
      expect(screen.getByText('initial-log')).toBeInTheDocument()

      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Refresh logs' })).toBeEnabled()
      )
      let completeRefresh = () => {}
      pendingRefresh = new Promise<void>((resolve) => {
        completeRefresh = resolve
      })
      fireEvent.click(screen.getByRole('button', { name: 'Refresh logs' }))
      await waitFor(() => expect(screen.getByRole('button', { name: 'Load more' })).toBeDisabled())
      expect(screen.getByText('initial-log')).toBeVisible()
      let tableOpacity = 1
      let element: HTMLElement | null = screen.getByRole('table')
      while (element) {
        tableOpacity *= Number(getComputedStyle(element).opacity || '1')
        element = element.parentElement
      }
      expect(tableOpacity).toBe(1)
      completeRefresh()
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Refresh logs' })).toBeEnabled()
      )
      pendingRefresh = undefined

      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      rows.push(createRow('first-arrival'), {
        ...createRow('late-arrival'),
        timestamp: rows[0].timestamp - 30_000_000,
      })
      fireEvent.click(screen.getByRole('button', { name: 'Live' }))
      await waitForLiveUpdate(() => {
        expect(screen.getByRole('checkbox', { name: /^Postgres/ })).toHaveAccessibleName(/\b3\b/)
        expect(screen.getByText('first-arrival')).toBeInTheDocument()
        expect(screen.getByText(/No more data to load/)).toHaveTextContent('3 of 3 rows')
      })
      await act(async () => {})

      rows.push(createRow('second-arrival'))
      await act(async () => vi.advanceTimersByTimeAsync(10_000))
      await waitForLiveUpdate(() => {
        expect(screen.getByRole('checkbox', { name: /^Postgres/ })).toHaveAccessibleName(/\b4\b/)
        expect(screen.getByText('second-arrival')).toBeInTheDocument()
        expect(screen.getByText(/No more data to load/)).toHaveTextContent('4 of 4 rows')
      })
      expect(screen.getAllByText('initial-log')).toHaveLength(1)
      expect(screen.getAllByText('first-arrival')).toHaveLength(1)
      expect(requests).toHaveLength(10)

      await act(async () => vi.advanceTimersByTimeAsync(10_000))
      await waitForLiveUpdate(() => expect(requests).toHaveLength(12))

      fireEvent.click(screen.getByRole('button', { name: 'Live' }))
      const requestsAfterPause = requests.length
      rows.push(createRow('paused-arrival'))
      await act(async () => vi.advanceTimersByTimeAsync(30_000))
      expect(requests).toHaveLength(requestsAfterPause)
      expect(screen.queryByText('paused-arrival')).not.toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: /^Postgres/ })).toHaveAccessibleName(/\b4\b/)
      unmount()
    },
    20_000
  )
})
