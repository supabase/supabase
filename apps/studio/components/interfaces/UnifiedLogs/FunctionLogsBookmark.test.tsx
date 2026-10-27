import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { useQueryState } from 'nuqs'
import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { UnifiedLogs } from './UnifiedLogs'
import {
  EDGE_FUNCTION_LOGS_VIEW,
  getEdgeFunctionLogsScope,
} from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview.utils'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer, type APIErrorBody } from '@/tests/lib/msw'

type AnalyticsResponse = components['schemas']['AnalyticsResponse_Output']
type ProjectResponse = components['schemas']['ProjectDetailResponse_Output']

mockAnimationsApi()

const log = (id: string, message: string) => ({
  id,
  timestamp: 1793142000000000,
  event_message: message,
  log_type: 'edge function runtime',
  level: 'success',
  status: null,
  pathname: null,
  method: null,
  log_count: null,
  logs: null,
})

const BookmarkControls = () => {
  const [id, setId] = useQueryState('id')
  return (
    <>
      <output aria-label="Current bookmark">{id ?? 'none'}</output>
      <button onClick={() => setId('second-log')}>Open second bookmark</button>
      <button onClick={() => setId(null)}>Close bookmark</button>
    </>
  )
}

describe('function log bookmarks', () => {
  beforeEach(() => {
    mswServer.use(
      http.get('/api/enabled-features-overrides', () =>
        HttpResponse.json<{ disabled_features: string[] }>({ disabled_features: [] })
      )
    )
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<ProjectResponse>({
          id: 1,
          ref: 'default',
          organization_id: 1,
          name: 'Test Project',
          status: 'INACTIVE',
          cloud_provider: 'AWS',
          region: 'us-east-1',
          db_host: 'db.default.supabase.co',
          restUrl: 'https://default.supabase.co/rest/v1/',
          inserted_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          subscription_id: 'sub_123',
          is_branch_enabled: false,
          is_physical_backups_enabled: false,
          high_availability: false,
          integration_source: null,
          connectionString: null,
        }),
    })
  })

  it('opens an older bookmark using the same function scope, filters, and dates', async () => {
    const requests: Array<{ sql: string; iso_timestamp_start: string; iso_timestamp_end: string }> =
      []
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        const body = z
          .object({
            sql: z.string(),
            iso_timestamp_start: z.string(),
            iso_timestamp_end: z.string(),
          })
          .parse(await request.json())
        requests.push(body)
        let result: AnalyticsResponse['result'] = []
        if (body.sql.includes('row list')) {
          result = Array.from({ length: 50 }, (_, i) => log(`recent-${i}`, `Recent output ${i}`))
          if (body.sql.includes("toString(id) = 'second-log'"))
            result = [log('second-log', 'Second bookmarked output')]
          if (body.sql.includes("toString(id) = 'older-log'"))
            result = [log('older-log', 'Bookmarked function output')]
        }
        return HttpResponse.json<AnalyticsResponse>({ result })
      },
    })
    customRender(
      <>
        <BookmarkControls />
        <UnifiedLogs
          scope={getEdgeFunctionLogsScope('fn-123')}
          hasFilterSideBar={false}
          {...EDGE_FUNCTION_LOGS_VIEW}
        />
      </>,
      {
        queryClient,
        nuqs: {
          hasMemory: true,
          searchParams: '?id=older-log&filter=level:eq:success&date=1793059200000-1793145600000',
        },
      }
    )

    expect(
      await screen.findByRole('status', { name: 'Bookmarked function output', hidden: true })
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Raw JSON', hidden: true })).toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    const lookup = requests.find(({ sql }) => sql.includes("toString(id) = 'older-log'"))
    expect(lookup).toBeDefined()
    expect(lookup?.sql).toContain("log_attributes['function_id'] IN ('fn-123')")
    expect(lookup?.sql).toContain("source = 'function_logs'")
    expect(lookup?.sql).toContain("'success'")
    expect(lookup?.sql).toContain('LIMIT 1')
    expect(lookup?.iso_timestamp_start).toBe('2026-10-27T00:00:00.000Z')
    expect(lookup?.iso_timestamp_end).toBe('2026-10-28T00:00:00.000Z')
    fireEvent.click(screen.getByText('Open second bookmark', { selector: 'button' }))
    expect(
      await screen.findByRole('status', { name: 'Second bookmarked output', hidden: true })
    ).toBeInTheDocument()
    expect(screen.queryByText('Bookmarked function output')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('Close bookmark', { selector: 'button' }))
    await waitFor(() =>
      expect(screen.queryByText('Second bookmarked output')).not.toBeInTheDocument()
    )
    fireEvent.click(screen.getByText('Recent output 0'))
    await waitFor(() =>
      expect(screen.getByLabelText('Current bookmark')).toHaveTextContent('recent-0')
    )
    fireEvent.click(screen.getAllByText('Recent output 1')[0], { ctrlKey: true })
    await waitFor(() =>
      expect(screen.getByLabelText('Current bookmark')).toHaveTextContent('recent-1')
    )
    expect(
      screen.getByRole('status', { name: '2 logs selected', hidden: true })
    ).toBeInTheDocument()
    expect(requests.some(({ sql }) => sql.includes("toString(id) = 'recent-"))).toBe(false)
  })

  it.each([
    { hasError: false, behavior: 'clears a bookmark when the scoped log no longer exists' },
    { hasError: true, behavior: 'keeps the bookmarked ID and displays a lookup error' },
  ])('$behavior', async ({ hasError }) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        const { sql } = z.object({ sql: z.string() }).parse(await request.json())
        if (hasError && sql.includes("toString(id) = 'older-log'")) {
          return HttpResponse.json<APIErrorBody>(
            { message: 'Bookmark lookup unavailable' },
            { status: 500 }
          )
        }
        return HttpResponse.json<AnalyticsResponse>({
          result: sql.includes('LIMIT 50') ? [log('recent-log', 'Recent output')] : [],
        })
      },
    })
    customRender(
      <>
        <BookmarkControls />
        <UnifiedLogs
          scope={getEdgeFunctionLogsScope('fn-123')}
          hasFilterSideBar={false}
          {...EDGE_FUNCTION_LOGS_VIEW}
        />
      </>,
      { queryClient, nuqs: { hasMemory: true, searchParams: '?id=older-log' } }
    )
    if (hasError) {
      expect(await screen.findByText(/Failed to retrieve logs/)).toBeInTheDocument()
      expect(screen.getByLabelText('Current bookmark')).toHaveTextContent('older-log')
    } else {
      await waitFor(() =>
        expect(screen.getByLabelText('Current bookmark')).toHaveTextContent('none')
      )
    }
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })
})
