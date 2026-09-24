import { QueryClient } from '@tanstack/react-query'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { useQueryStates } from 'nuqs'
import { ResizablePanelGroup } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import { ServiceFlowPanel } from '../ServiceFlowPanel'
import { SEARCH_PARAMS_PARSER } from '../UnifiedLogs.constants'
import { ColumnSchema } from '../UnifiedLogs.schema'
import { generateDynamicColumns } from './Columns'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import { miscKeys } from '@/data/misc/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type LogsResponse = platformComponents['schemas']['AnalyticsResponse_Output']

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ ref: 'default' }),
    useFlag: (name: string) => name === 'otelUnifiedLogs',
  }
})

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

const timelineRows = [
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

function PanelHarness() {
  const [searchParameters] = useQueryStates(SEARCH_PARAMS_PARSER)
  const { columns } = generateDynamicColumns({ data: [gatewayLog] })
  const table = useReactTable({
    data: [gatewayLog],
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
          selectedRows={[gatewayLog]}
          searchParameters={searchParameters}
        />
      </ResizablePanelGroup>
    </DataTableProvider>
  )
}

function renderPanel(rows: typeof timelineRows = timelineRows) {
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
      const { sql } = (await request.json()) as { sql: string }
      queries.push(sql)
      if (sql.includes('log attributes')) {
        return HttpResponse.json<LogsResponse>({
          result: [
            {
              source: 'edge_logs',
              log_attributes: { 'request.headers.cf_ray': RAY_ID, 'request.method': 'POST' },
            },
          ],
        })
      }
      if (sql.includes('request timeline')) return HttpResponse.json<LogsResponse>({ result: rows })
      return HttpResponse.json<LogsResponse>({ result: [] })
    },
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(miscKeys.enabledFeaturesOverride(), { disabled_features: [] })
  customRender(<PanelHarness />, { queryClient })
  return { queries }
}

describe('request timeline tab', () => {
  const openTimeline = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('tab', { name: 'Timeline' }))
    return screen.findByRole('list', { name: 'Related logs' })
  }
  const stepsIn = (list: HTMLElement) =>
    within(list)
      .getAllByRole('button')
      .filter((button) => !/^\+\d+ more$/.test(button.textContent?.trim() ?? ''))

  it('lists logs sharing the request ID and opens one in the overview', async () => {
    const user = userEvent.setup()
    const { queries } = renderPanel()

    const items = stepsIn(await openTimeline(user))
    expect(items).toHaveLength(2)
    // One line per step, like the logs list: type icon, status, method, path
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
    // API Gateway logs have no hand-written layout, so their attributes are grouped
    expect(await screen.findByText('Request headers')).toBeVisible()
    // Only the first section starts open
    expect(screen.queryByText('method')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Request' }))
    expect(screen.getByText('method')).toBeVisible()
  })

  it('keeps an open log between the hidden steps before and after it', async () => {
    const user = userEvent.setup()
    const authSteps = Array.from({ length: 8 }, (_, i) => ({
      ...timelineRows[1],
      id: `auth-log-${i}`,
      timestamp: `2026-01-01T10:00:00.0${10 + i}000`,
    }))
    renderPanel([timelineRows[0], ...authSteps])

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
  })
})
