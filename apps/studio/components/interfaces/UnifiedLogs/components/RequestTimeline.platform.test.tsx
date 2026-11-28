import { QueryClient } from '@tanstack/react-query'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents } from 'api-types'
import { FeatureFlagContext, LOCAL_STORAGE_KEYS } from 'common'
import { http, HttpResponse } from 'msw'
import { createDynamicRouteParser } from 'next-router-mock/dynamic-routes'
import { useQueryStates } from 'nuqs'
import { ResizablePanelGroup } from 'ui'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { ServiceFlowPanel } from '../ServiceFlowPanel'
import { SEARCH_PARAMS_PARSER } from '../UnifiedLogs.constants'
import { ColumnSchema } from '../UnifiedLogs.schema'
import type { UnifiedLogsScope } from '../UnifiedLogs.types'
import { toQuerySearchParams } from '../UnifiedLogs.utils'
import { generateDynamicColumns } from './Columns'
import { FeaturePreviewContextProvider } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import type { User } from '@/data/auth/users-infinite-query'
import type { UnifiedLogsQueryRow } from '@/data/logs/unified-logs.utils'
import { miscKeys } from '@/data/misc/keys'
import { API_URL } from '@/lib/constants'
import { TimezoneProvider } from '@/lib/datetime'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'

type LogsResponse = platformComponents['schemas']['AnalyticsResponse_Output']

vi.unmock('common')
const { default: routerMock } =
  await vi.importMock<typeof import('next-router-mock')>('next/router')
const removeRouteParser = routerMock.useParser(createDynamicRouteParser(['/project/[ref]/logs']))
afterAll(removeRouteParser)
const requestSchema = z.object({ sql: z.string() })

const RAY_ID = '8f00aa11bb22cc33-IAD'

const gatewayLog: ColumnSchema = {
  id: 'gateway-log',
  log_type: 'edge',
  method: 'POST',
  pathname: '/auth/v1/token',
  status: 200,
  level: 'success',
  timestamp: 1_767_261_600_000_000,
  date: new Date('2026-01-01T10:00:00.000Z'),
  event_message: 'POST | 200 | /auth/v1/token',
}

const timelineRows: (UnifiedLogsQueryRow & { source: string })[] = [
  {
    id: 'gateway-log',
    source: 'edge_logs',
    timestamp: '2026-01-01T10:00:00.000000',
    log_type: 'edge',
    status: '200',
    level: 'success',
    pathname: '/auth/v1/token',
    event_message: 'POST | 200 | /auth/v1/token',
    method: 'POST',
    auth_user: null,
    metadata: { 'request.headers.cf_ray': RAY_ID },
    log_count: null,
    logs: null,
  },
  {
    id: 'auth-log',
    source: 'auth_logs',
    timestamp: '2026-01-01T10:00:00.045000',
    log_type: 'auth',
    status: '200',
    level: 'success',
    pathname: null,
    event_message: JSON.stringify({ msg: 'Login', path: '/token', method: 'POST', status: 200 }),
    method: null,
    auth_user: null,
    metadata: { request_id: RAY_ID },
    log_count: null,
    logs: null,
  },
]

function PanelHarness({
  scope,
  row = gatewayLog,
  onSelectRow,
}: {
  scope?: UnifiedLogsScope
  row?: ColumnSchema
  onSelectRow?: (id: string) => void
}) {
  const [searchParameters] = useQueryStates(SEARCH_PARAMS_PARSER)
  const { columns } = generateDynamicColumns({ data: [row] })
  const table = useReactTable({
    data: onSelectRow ? [row, { ...row, id: 'next-log' }] : [row],
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <DataTableProvider
      table={table}
      columns={columns}
      filterFields={[]}
      error={null}
      isError={false}
      isLoading={false}
      isFetching={false}
      isLoadingCounts={false}
      openRowId={row.id}
      onSelectRow={onSelectRow}
    >
      <ResizablePanelGroup orientation="horizontal">
        <ServiceFlowPanel
          dock="right"
          setDock={vi.fn()}
          selectedRows={[row]}
          searchParameters={{ ...toQuerySearchParams(searchParameters), scope }}
        />
      </ResizablePanelGroup>
    </DataTableProvider>
  )
}

function renderPanel(
  rows: typeof timelineRows = timelineRows,
  {
    scope,
    flag = true,
    enableTracesWaterfall = true,
    timezone,
    selectedLog,
    onSelectRow,
    attributesReady,
  }: {
    scope?: UnifiedLogsScope
    flag?: boolean | null
    enableTracesWaterfall?: boolean
    timezone?: string
    selectedLog?: ColumnSchema
    onSelectRow?: (id: string) => void
    attributesReady?: Promise<void>
  } = {}
) {
  const queries: string[] = []
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: {
      cloud_provider: 'AWS',
      db_host: 'db.default.supabase.co',
      high_availability: false,
      id: 1,
      inserted_at: '2026-01-01T00:00:00Z',
      integration_source: null,
      is_branch_enabled: false,
      is_physical_backups_enabled: false,
      name: 'Test project',
      organization_id: 1,
      ref: 'default',
      region: 'us-east-1',
      restUrl: 'https://default.supabase.co',
      status: 'ACTIVE_HEALTHY',
      subscription_id: 'subscription-1',
      updated_at: '2026-01-01T00:00:00Z',
      connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
    },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
    response: async ({ request }) => {
      const { sql } = requestSchema.parse(await request.json())
      queries.push(sql)
      if (sql.includes('SELECT source, log_attributes')) {
        await attributesReady
        return HttpResponse.json<LogsResponse>({
          result: [
            {
              source: 'edge_logs',
              log_attributes: { 'request.headers.cf_ray': RAY_ID, 'request.method': 'POST' },
            },
          ],
        })
      }
      if (sql.includes('ORDER BY timestamp ASC, id ASC'))
        return HttpResponse.json<LogsResponse>({ result: rows })
      return HttpResponse.json<LogsResponse>({ result: [] })
    },
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(miscKeys.enabledFeaturesOverride(), { disabled_features: [] })
  if (timezone) localStorage.setItem(LOCAL_STORAGE_KEYS.UI_TIMEZONE, JSON.stringify(timezone))
  customRender(
    <FeatureFlagContext.Provider
      value={{
        configcat: flag === null ? {} : { otelUnifiedLogs: flag, enableTracesWaterfall },
        posthog: {},
        hasLoaded: true,
      }}
    >
      <FeaturePreviewContextProvider>
        <TimezoneProvider>
          <PanelHarness scope={scope} row={selectedLog} onSelectRow={onSelectRow} />
        </TimezoneProvider>
      </FeaturePreviewContextProvider>
    </FeatureFlagContext.Provider>,
    { queryClient }
  )
  return { queries, queryClient }
}

describe('request timeline tab', () => {
  beforeEach(() => routerMock.setCurrentUrl('/project/default/logs'))
  afterEach(() => localStorage.removeItem(LOCAL_STORAGE_KEYS.UI_TIMEZONE))
  const openTimeline = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('tab', { name: 'Timeline' }))
    return screen.findByRole('list', { name: 'Related logs' })
  }
  const stepsIn = (list: HTMLElement) =>
    within(list)
      .getAllByRole('button')
      .filter((button) => !/^\+\d+ more$/.test(button.textContent?.trim() ?? ''))

  it.each([
    {
      flag: false,
      scope: { filters: [{ column: 'function_id', operator: '=' as const, value: 'fn-1' }] },
      expected: true,
      name: 'shows the timeline for scoped logs with the legacy backend selected',
    },
    {
      flag: false,
      scope: undefined,
      expected: false,
      name: 'hides the timeline for unscoped logs with the legacy backend selected',
    },
    {
      flag: null,
      scope: undefined,
      expected: true,
      name: 'shows the timeline before the backend flag loads',
    },
  ])('$name', async ({ flag, scope, expected }) => {
    const { queryClient } = renderPanel(timelineRows, { flag, scope })
    if (expected) expect(screen.getByRole('tab', { name: 'Timeline' })).toBeVisible()
    else expect(screen.queryByRole('tab', { name: 'Timeline' })).not.toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it('uses the selected timezone for log and request timestamps while preserving offsets', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderPanel(timelineRows, { timezone: 'Asia/Tokyo' })
    expect(await screen.findByText('01 Jan 2026 19:00:00')).toBeVisible()
    const items = stepsIn(await openTimeline(user))
    expect(items[0]).toHaveTextContent('01 Jan 2026 19:00:00')
    expect(items[1]).toHaveTextContent('+45 ms')
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it('opens a selected related log in Overview while keeping the original request timeline', async () => {
    const user = userEvent.setup()
    const { queries, queryClient } = renderPanel()

    const items = stepsIn(await openTimeline(user))
    expect(items).toHaveLength(2)

    expect(within(items[0]).getByRole('img', { name: 'edge' })).toBeInTheDocument()
    expect(items[0]).toHaveTextContent('POST/auth/v1/token')
    expect(items[0]).toHaveAttribute('aria-current', 'true')
    expect(within(items[1]).getByRole('img', { name: 'auth' })).toBeInTheDocument()
    expect(items[1]).toHaveTextContent('+45 ms')
    expect(
      queries.some((sql) => sql.includes(`log_attributes['request_id'] IN ('${RAY_ID}')`))
    ).toBe(true)

    await user.click(items[1])
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus()
    expect(await screen.findByText('Authentication')).toBeVisible()

    await user.click(screen.getByRole('tab', { name: 'Timeline' }))
    const [gateway, auth] = stepsIn(screen.getByRole('list', { name: 'Related logs' }))
    expect(auth).toHaveAttribute('aria-current', 'true')
    gateway.focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus()
    expect(await screen.findByText('Request headers')).toBeVisible()

    expect(screen.queryByText('method')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Request' }))
    expect(screen.getByText('method')).toBeVisible()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  const TRACE_ID = 'a'.repeat(32)
  const tracedRows = timelineRows.map((row) => ({
    ...row,
    metadata: { ...row.metadata, trace_id: TRACE_ID },
  }))
  const spanResponse = {
    data: [
      {
        type: 'span',
        id: 'span-1',
        attributes: {
          parent_span_id: null,
          service_name: 'postgrest',
          span_name: 'GET /rest/v1/orders',
          span_kind: 'server',
          status_code: 'ok',
          start_time: '2026-01-01T10:00:00.000Z',
          duration_ns: 1_500_000,
        },
      },
      {
        type: 'span',
        id: 'span-2',
        attributes: {
          parent_span_id: null,
          service_name: 'postgres',
          span_name: 'SELECT orders',
          span_kind: 'client',
          status_code: 'ok',
          start_time: '2026-01-01T10:00:00.002Z',
          duration_ns: 900_000,
        },
      },
    ],
    meta: { partial: true },
  }
  const mockTrace = (response: typeof spanResponse = spanResponse) =>
    mswServer.use(
      http.get(`${API_URL}/v2/projects/:ref/analytics/traces/:traceId`, () =>
        HttpResponse.json(response)
      )
    )

  const openTrace = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(await screen.findByRole('tab', { name: 'Trace' }))
  }

  it('always offers the Trace tab, with an empty state when the request has no trace id', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderPanel(timelineRows)

    await openTrace(user)

    expect(await screen.findByText('No trace for this request')).toBeVisible()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it('renders the trace header and waterfall once the spans come back', async () => {
    const user = userEvent.setup()
    mockTrace()
    const { queryClient } = renderPanel(tracedRows)

    await openTrace(user)

    // Trace.Title is the root span's name; the rest of the header is ours
    expect(await screen.findByRole('heading', { name: 'GET /rest/v1/orders' })).toBeVisible()
    expect(screen.getByText(TRACE_ID)).toBeVisible()
    expect(screen.getByText('postgres, postgrest')).toBeVisible()
    expect(screen.getByText('Partial')).toBeVisible()
    // The waterfall virtualises its rows against a measured viewport, which jsdom never lays
    // out, so individual span rows can't be asserted here — only that the tree mounted.
    expect(screen.getByRole('tree')).toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it('shows an error in the Trace tab when the trace fetch fails', async () => {
    const user = userEvent.setup()
    mswServer.use(
      http.get(`${API_URL}/v2/projects/:ref/analytics/traces/:traceId`, () =>
        HttpResponse.json({ message: 'Not found' }, { status: 404 })
      )
    )
    renderPanel(tracedRows)

    await openTrace(user)

    expect(await screen.findByText('Failed to retrieve trace')).toBeVisible()
  })

  it('shows a plain empty state when the trace has no spans', async () => {
    const user = userEvent.setup()
    mockTrace({ data: [], meta: { partial: false } })
    const { queryClient } = renderPanel(tracedRows)

    await openTrace(user)

    expect(await screen.findByText('No spans recorded')).toBeVisible()
    expect(screen.queryByText('Partial')).not.toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it('keeps the Timeline free of trace UI even when a trace resolves', async () => {
    const user = userEvent.setup()
    mockTrace()
    const { queryClient } = renderPanel(tracedRows)

    const list = await openTimeline(user)

    expect(within(list).queryByText('GET /rest/v1/orders')).not.toBeInTheDocument()
    expect(screen.queryByText('Partial')).not.toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it('hides the Trace tab when enableTracesWaterfall is off', async () => {
    mockTrace()
    const { queryClient } = renderPanel(tracedRows, { enableTracesWaterfall: false })

    await screen.findByRole('tab', { name: 'Timeline' })
    expect(screen.queryByRole('tab', { name: 'Trace' })).not.toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  // A spinner the size of the icon replaces a loading row, so nothing shifts when loading ends
  it('spins in place of the log type icon until the log details load', async () => {
    const attributes = Promise.withResolvers<void>()
    const { queryClient } = renderPanel(timelineRows, { attributesReady: attributes.promise })
    const header = screen.getByRole('status')
    expect(await within(header).findByRole('img', { name: 'Loading log details' })).toBeVisible()

    attributes.resolve()
    await waitFor(() =>
      expect(
        within(header).queryByRole('img', { name: 'Loading log details' })
      ).not.toBeInTheDocument()
    )
    expect(within(header).getByRole('img')).toBeVisible()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it('shows an empty state when no related logs share an ID', async () => {
    const user = userEvent.setup()
    const { queryClient } = renderPanel([])

    await user.click(screen.getByRole('tab', { name: 'Timeline' }))

    expect(await screen.findByRole('heading', { name: 'No related logs' })).toBeVisible()
    // Announced through a live region, since the empty state replaces the loader silently
    expect(
      screen.getByText('No related logs', { selector: '[aria-live="polite"]' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Logs appear here when they share a request, trace, or function execution ID.'
      )
    ).toBeVisible()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it('keeps an open log between the hidden steps before and after it', async () => {
    const user = userEvent.setup()
    const authSteps = Array.from({ length: 8 }, (_, i) => ({
      ...timelineRows[1],
      id: `auth-log-${i}`,
      timestamp: `2026-01-01T10:00:00.0${10 + i}000`,
    }))
    const { queryClient } = renderPanel([timelineRows[0], ...authSteps])

    expect(stepsIn(await openTimeline(user))).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: '+6 more' }))
    const expandedList = await screen.findByRole('list', { name: 'Related logs' })
    await user.click(stepsIn(expandedList)[6])
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus()

    const folded = stepsIn(await openTimeline(user))
    expect(folded).toHaveLength(4)
    expect(folded[3]).toHaveAttribute('aria-current', 'true')
    const list = screen.getByRole('list', { name: 'Related logs' })
    const buttons = within(list).getAllByRole('button')
    expect(buttons[3]).toHaveTextContent('+3 more')
    expect(buttons[4]).toHaveAttribute('aria-current', 'true')
    expect(buttons[5]).toHaveTextContent('+2 more')
    buttons[5].focus()
    await user.keyboard('{Enter}')
    expect(stepsIn(list)).toHaveLength(9)
    expect(stepsIn(list)[6]).toHaveAttribute('aria-current', 'true')
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })
  it('shows the user of the opened timeline log instead of the initially selected log', async () => {
    const user = userEvent.setup()
    const firstUser = '11111111-1111-4111-8111-111111111111'
    const openedUser = '22222222-2222-4222-8222-222222222222'
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = z.object({ query: z.string() }).parse(await request.json())
        const isOpenedUser = query.includes(openedUser)
        return HttpResponse.json<User[]>([
          {
            id: isOpenedUser ? openedUser : firstUser,
            email: isOpenedUser ? 'opened@example.com' : 'initial@example.com',
            providers: ['email'],
          },
        ])
      },
    })
    const { queryClient } = renderPanel(
      [
        { ...timelineRows[0], auth_user: firstUser },
        { ...timelineRows[1], auth_user: openedUser },
      ],
      { selectedLog: { ...gatewayLog, auth_user: firstUser } }
    )
    const items = stepsIn(await openTimeline(user))
    await user.click(items[1])
    await user.click(screen.getByRole('tab', { name: 'User' }))
    expect(await screen.findAllByText('opened@example.com')).toHaveLength(2)
    expect(screen.queryByText('initial@example.com')).not.toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })
  it('copies the user ID with arrow keys without navigating away from the log', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    const userId = '11111111-1111-4111-8111-111111111111'
    const onSelectRow = vi.fn()
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: () => HttpResponse.json<User[]>([{ id: userId, providers: ['email'] }]),
    })
    const { queryClient } = renderPanel(timelineRows, {
      selectedLog: { ...gatewayLog, auth_user: userId },
      onSelectRow,
    })
    await user.click(screen.getByRole('tab', { name: 'User' }))
    const field = await screen.findByRole('button', { name: `User ID ${userId}` })
    field.focus()
    await user.keyboard('{Enter}')
    expect(await screen.findByRole('menuitem', { name: 'Filter: equals' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Copy User ID' })).toHaveFocus()
    expect(onSelectRow).not.toHaveBeenCalled()
    await user.keyboard('{Enter}')
    expect(copy).toHaveBeenCalledWith(userId)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await user.keyboard('{ArrowDown}')
    expect(onSelectRow).toHaveBeenCalledWith('next-log', { shiftKey: false })
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })
})
