import { QueryClient } from '@tanstack/react-query'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents } from 'api-types'
import { FeatureFlagContext, LOCAL_STORAGE_KEYS } from 'common'
import { HttpResponse } from 'msw'
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
import { TimezoneProvider } from '@/lib/datetime'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

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
}: {
  scope?: UnifiedLogsScope
  row?: ColumnSchema
}) {
  const [searchParameters] = useQueryStates(SEARCH_PARAMS_PARSER)
  const { columns } = generateDynamicColumns({ data: [row] })
  const table = useReactTable({
    data: [row],
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
    timezone,
    selectedLog,
  }: { scope?: UnifiedLogsScope; flag?: boolean | null; timezone?: string } = {}
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
        configcat: flag === null ? {} : { otelUnifiedLogs: flag },
        posthog: {},
        hasLoaded: true,
      }}
    >
      <FeaturePreviewContextProvider>
        <TimezoneProvider>
          <PanelHarness scope={scope} row={selectedLog} />
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
    expect(screen.getByText('01 Jan 2026 19:00:00')).toBeVisible()
    expect(items[0]).toHaveTextContent('+0 ms')
    expect(items[1]).toHaveTextContent('+45 ms')
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it('lists logs sharing the request ID and opens one in the overview', async () => {
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
    expect(screen.getByRole('status')).toHaveTextContent('POST /token')
    expect(screen.getByText('Authentication')).toBeVisible()

    const [gateway, auth] = stepsIn(await openTimeline(user))
    expect(auth).toHaveAttribute('aria-current', 'true')
    await user.click(gateway)
    expect(screen.getByRole('status')).toHaveTextContent('POST /auth/v1/token')

    expect(await screen.findByText('Request headers')).toBeVisible()

    expect(screen.queryByText('method')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Request' }))
    expect(screen.getByText('method')).toBeVisible()
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
    await user.click(stepsIn(await screen.findByRole('list', { name: 'Related logs' }))[6])
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')

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
    const expanded = stepsIn(list)
    expect(expanded).toHaveLength(9)
    expect(expanded[6]).toHaveAttribute('aria-current', 'true')
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
})
