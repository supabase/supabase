import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { FeatureFlagContext, LOCAL_STORAGE_KEYS } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { UnifiedLogs } from './UnifiedLogs'
import { createUnifiedLogsSearch } from './UnifiedLogs.utils'
import {
  EDGE_FUNCTION_LOGS_VIEW,
  getEdgeFunctionLogsScope,
} from '@/components/interfaces/Functions/EdgeFunctionOverview/EdgeFunctionOverview.utils'
import { retrieveUnifiedLogs } from '@/data/logs/get-unified-logs'
import { getUnifiedLogs } from '@/data/logs/unified-logs-infinite-query'
import type { UnifiedLogsQueryRow } from '@/data/logs/unified-logs.utils'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'

type AnalyticsResponse = components['schemas']['AnalyticsResponse_Output']
type ProjectResponse = components['schemas']['ProjectDetailResponse_Output']

const FUNCTION_SCOPE = getEdgeFunctionLogsScope('fn-123')

mockAnimationsApi()

describe('UnifiedLogs', () => {
  afterEach(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.UNIFIED_LOGS_DOCK)
    localStorage.removeItem(`${LOCAL_STORAGE_KEYS.UNIFIED_LOGS_DOCK}-edge-function`)
  })

  beforeEach(() => {
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

  it('refreshes pathname options for a sidebar filter change before the URL updates', async () => {
    let pathnameOption: string | null = null
    const onUrlUpdate = vi.fn()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all',
      response: () =>
        HttpResponse.json<AnalyticsResponse>({
          result: pathnameOption === null ? [] : [{ value: pathnameOption, count: 1 }],
        }),
    })

    customRender(
      <FeatureFlagContext.Provider
        value={{ configcat: { otelUnifiedLogs: false }, posthog: {}, hasLoaded: true }}
      >
        <UnifiedLogs />
      </FeatureFlagContext.Provider>,
      {
        nuqs: { hasMemory: true, onUrlUpdate },
        queryClient,
      }
    )

    expect(await screen.findByText('No results found', {}, { timeout: 5_000 })).toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0), { timeout: 5_000 })

    pathnameOption = '/before'
    fireEvent.click(screen.getByRole('button', { name: 'Pathname' }))
    expect(await screen.findByText('/before', {}, { timeout: 5_000 })).toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0), { timeout: 5_000 })
    onUrlUpdate.mockClear()

    fireEvent.click(screen.getByRole('button', { name: 'Method' }))
    pathnameOption = '/after'
    fireEvent.click(screen.getByRole('checkbox', { name: /POST/ }))

    expect(onUrlUpdate).not.toHaveBeenCalled()
    expect(screen.queryByText('/before')).not.toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('/after')).toBeInTheDocument(), {
      timeout: 5_000,
    })
  }, 15_000)

  it('limits function logs to the supported filters and scopes rows, counts, and chart requests', async () => {
    const user = userEvent.setup()
    const queries: string[] = []

    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        queries.push(z.object({ sql: z.string() }).parse(await request.json()).sql)
        return HttpResponse.json<AnalyticsResponse>({ result: [] })
      },
    })
    customRender(
      <UnifiedLogs scope={FUNCTION_SCOPE} hasFilterSideBar={false} {...EDGE_FUNCTION_LOGS_VIEW} />,
      { nuqs: { hasMemory: true } }
    )

    expect(await screen.findByText('No results found')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^(Show|Hide) filters$/ })).not.toBeInTheDocument()
    await user.click(screen.getByTestId('filter-bar-freeform-input'))
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Time range',
      'Log Type',
      'Level',
      'Event message',
    ])
    await waitFor(() => {
      expect(queries.some((sql) => sql.includes('row list'))).toBe(true)
      expect(queries.some((sql) => sql.includes('sidebar facet counts'))).toBe(true)
      expect(queries.some((sql) => sql.includes('severity chart'))).toBe(true)
    })
    for (const sql of queries.filter((sql) => !sql.includes('arrayJoin(mapKeys'))) {
      expect(sql).toContain("log_attributes['function_id'] IN ('fn-123')")
      expect(sql).toContain("source = 'function_logs'")
    }
  })

  it('discovers attributes and applies a manual key through shared row, count, and chart requests', async () => {
    const user = userEvent.setup()
    const queries: string[] = []
    const onUrlUpdate = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        const { sql } = z.object({ sql: z.string() }).parse(await request.json())
        queries.push(sql)
        return HttpResponse.json<AnalyticsResponse>({
          result: sql.includes('arrayJoin(mapKeys') ? [{ key: 'request_id', n: 1 }] : [],
        })
      },
    })
    customRender(<UnifiedLogs hasFilterSideBar={false} />, {
      nuqs: { hasMemory: true, onUrlUpdate },
    })
    expect(await screen.findByText('No results found')).toBeInTheDocument()
    const input = screen.getByTestId('filter-bar-freeform-input')
    await user.click(input)
    expect(await screen.findByRole('option', { name: 'Attribute: request_id' })).toBeVisible()
    fireEvent.change(input, { target: { value: 'manual:key' } })
    await user.click(await screen.findByRole('option', { name: 'Attribute: manual:key' }))
    const valueInput = screen.getByTestId('filter-value-attribute.manual:key')
    fireEvent.change(valueInput, { target: { value: "value'with:colon" } })
    await user.keyboard('{Enter}')
    await waitFor(() => {
      const filtered = queries.filter((sql) =>
        sql.includes("log_attributes['manual:key'] IN ('value''with:colon')")
      )
      expect(filtered.some((sql) => sql.includes('row list'))).toBe(true)
      expect(filtered.some((sql) => sql.includes('sidebar facet counts'))).toBe(true)
      expect(filtered.some((sql) => sql.includes('severity chart'))).toBe(true)
    })
    expect(onUrlUpdate).toHaveBeenCalled()
    expect(
      queries
        .filter((sql) => sql.includes('arrayJoin(mapKeys'))
        .some((sql) => sql.includes("source = 'postgres_logs'"))
    ).toBe(true)
    expect(
      queries
        .filter((sql) => sql.includes('arrayJoin(mapKeys'))
        .some((sql) => sql.includes("source = 'edge_logs'"))
    ).toBe(true)
  })

  it('keeps restored attribute exclusions when changing builtin filters', async () => {
    const queries: string[] = []
    const onUrlUpdate = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        const { sql } = z.object({ sql: z.string() }).parse(await request.json())
        queries.push(sql)
        return HttpResponse.json<AnalyticsResponse>({ result: [] })
      },
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const view = customRender(<UnifiedLogs />, {
      queryClient,
      nuqs: {
        hasMemory: true,
        onUrlUpdate,
        searchParams: '?filter=attribute.status:neq:failure,request_id:eq:req-1',
      },
    })
    expect(await screen.findByText('No results found')).toBeInTheDocument()
    expect(screen.getByTestId('filter-value-attribute.status')).toHaveValue('failure')
    expect(screen.getByTestId('filter-value-request_id')).toHaveValue('req-1')
    fireEvent.click(screen.getByRole('button', { name: 'Method' }))
    fireEvent.click(screen.getByRole('checkbox', { name: /POST/ }))
    await waitFor(() =>
      expect(
        queries.some(
          (sql) =>
            sql.includes("log_attributes['status'] NOT IN ('failure')") &&
            sql.includes("log_attributes['request_id'] IN ('req-1')") &&
            sql.includes("IN ('POST')")
        )
      ).toBe(true)
    )
    const lastUpdate = onUrlUpdate.mock.lastCall?.[0]
    expect(lastUpdate.searchParams.get('filter')).toContain('attribute.status:neq:failure')
    expect(lastUpdate.searchParams.get('filter')).toContain('request_id:eq:req-1')
    view.unmount()
  })

  it('keeps attribute filters in paginated and exported network requests', async () => {
    const queries: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        queries.push(z.object({ sql: z.string() }).parse(await request.json()).sql)
        return HttpResponse.json<AnalyticsResponse>({ result: [] })
      },
    })
    const search = createUnifiedLogsSearch({ filter: ['attribute.trace_id:neq:trace-1'] })
    await getUnifiedLogs({
      projectRef: 'default',
      search,
      useOtel: true,
      pageParam: {
        direction: 'next',
        cursor: 1,
        row: { id: 'cursor-row', timestamp: '2026-01-01T10:00:00Z' },
      },
    })
    await retrieveUnifiedLogs({ projectRef: 'default', search, useOtel: true, limit: 100 })
    expect(queries).toHaveLength(2)
    expect(queries[0]).toContain("'cursor-row'")
    expect(queries[1]).toContain('LIMIT 100')
    for (const sql of queries)
      expect(sql).toContain("log_attributes['trace_id'] NOT IN ('trace-1')")
  })

  it('keeps loaded logs readable without claiming zero matches when counts fail', async () => {
    let releaseCount: () => void = () => {}
    const pendingCount = new Promise<void>((resolve) => {
      releaseCount = resolve
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        const { sql } = z.object({ sql: z.string() }).parse(await request.json())
        if (sql.includes('sidebar facet counts')) {
          await pendingCount
          return HttpResponse.json<AnalyticsResponse>({ error: 'Count query failed' })
        }
        return HttpResponse.json<AnalyticsResponse>({
          result: sql.includes('row list')
            ? [0, 1].map((index) => ({
                id: `log-${index}`,
                log_type: 'edge function runtime',
                timestamp: Date.now() * 1000,
                event_message: `Runtime error ${index}`,
                level: 'error',
                method: null,
                pathname: null,
                status: null,
                log_count: null,
                logs: null,
              }))
            : [],
        })
      },
    })
    customRender(
      <UnifiedLogs scope={FUNCTION_SCOPE} hasFilterSideBar={false} {...EDGE_FUNCTION_LOGS_VIEW} />,
      { queryClient }
    )

    try {
      expect(await screen.findByText('Runtime error 0')).toBeInTheDocument()
      expect(screen.getByText(/No more data to load/)).toHaveTextContent(
        /^No more data to load \(2 rows\)$/
      )
    } finally {
      releaseCount()
    }
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
    expect(screen.getByText('Runtime error 1')).toBeInTheDocument()
    expect(screen.getByText(/No more data to load/)).toHaveTextContent(
      /^No more data to load \(2 rows\)$/
    )
  })

  it('remembers the function dock independently from the project dock when reopening logs', async () => {
    const user = userEvent.setup({ delay: null })
    mswServer.use(
      http.get('/api/enabled-features-overrides', () =>
        HttpResponse.json<{ disabled_features: string[] }>({ disabled_features: [] })
      )
    )
    const log: UnifiedLogsQueryRow = {
      id: 'function-log',
      log_type: 'edge function runtime',
      timestamp: Date.now() * 1000,
      event_message: 'Function started',
      level: 'success',
      method: null,
      pathname: null,
      status: null,
      log_count: null,
      logs: null,
    }
    for (const path of [
      '/platform/projects/:ref/analytics/endpoints/logs.all',
      '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
    ] as const) {
      addAPIMock({
        method: 'post',
        path,
        response: async ({ request }) => {
          const { sql } = z.object({ sql: z.string() }).parse(await request.json())
          return HttpResponse.json<AnalyticsResponse>({
            result: sql.includes('row list') ? [log] : [],
          })
        },
      })
    }
    const renderLogs = (isFunction: boolean) =>
      customRender(
        <FeatureFlagContext.Provider
          value={{ configcat: { otelUnifiedLogs: true }, posthog: {}, hasLoaded: true }}
        >
          <UnifiedLogs
            scope={isFunction ? FUNCTION_SCOPE : undefined}
            hasFilterSideBar={false}
            columnPreferencesKey={
              isFunction ? EDGE_FUNCTION_LOGS_VIEW.columnPreferencesKey : undefined
            }
          />
        </FeatureFlagContext.Provider>,
        { nuqs: { hasMemory: true, searchParams: '?id=function-log' } }
      )
    const waitForDock = async ({ container }: ReturnType<typeof renderLogs>) => {
      const view = within(container)
      await view.findByLabelText('Dock side')
      return view
    }

    const first = renderLogs(true)
    const firstView = await waitForDock(first)
    expect(firstView.getByRole('separator', { hidden: true })).toHaveAttribute(
      'aria-orientation',
      'horizontal'
    )
    fireEvent.keyDown(firstView.getByLabelText('Dock side'), { key: 'Enter' })
    await user.click(await screen.findByRole('menuitem', { name: 'Dock to right', hidden: true }))
    await waitFor(() =>
      expect(firstView.getByRole('separator', { hidden: true })).toHaveAttribute(
        'aria-orientation',
        'vertical'
      )
    )
    first.unmount()

    const project = renderLogs(false)
    const projectView = await waitForDock(project)
    expect(projectView.getByRole('separator', { hidden: true })).toHaveAttribute(
      'aria-orientation',
      'horizontal'
    )
    project.unmount()

    const reopenedView = await waitForDock(renderLogs(true))
    await waitFor(() =>
      expect(reopenedView.getByRole('separator', { hidden: true })).toHaveAttribute(
        'aria-orientation',
        'vertical'
      )
    )
  })
})
