import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents } from 'api-types'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import { createDynamicRouteParser } from 'next-router-mock/dynamic-routes'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { ColumnSchema } from '../UnifiedLogs.schema'
import type { QuerySearchParamsType } from '../UnifiedLogs.types'
import { createUnifiedLogsSearch, getLogTypeSource } from '../UnifiedLogs.utils'
import { LogUser } from './LogUser'
import { FeaturePreviewContextProvider } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { User } from '@/data/auth/users-infinite-query'
import type { UnifiedLogsQueryRow } from '@/data/logs/unified-logs.utils'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type LogsResponse = platformComponents['schemas']['AnalyticsResponse_Output']
type TimelineRow = UnifiedLogsQueryRow & { source: string }

const deployment = vi.hoisted(() => ({ basePath: '' }))
vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  get BASE_PATH() {
    return deployment.basePath
  },
}))

vi.unmock('common')
const { default: routerMock } =
  await vi.importMock<typeof import('next-router-mock')>('next/router')
const removeRouteParser = routerMock.useParser(createDynamicRouteParser(['/project/[ref]/logs']))
afterAll(removeRouteParser)
const requestSchema = z.object({ sql: z.string() })

const USER_ID = '6f1c1a8e-4a0b-4c1e-9b1e-2f3a4b5c6d7e'

const baseLog: ColumnSchema = {
  id: 'log-1',
  log_type: 'edge',
  method: 'GET',
  pathname: '/rest/v1/todos',
  status: 200,
  level: 'success',
  timestamp: 1_767_261_600_000_000,
  date: new Date('2026-01-01T10:00:00.000Z'),
  event_message: 'GET | 200 | /rest/v1/todos',
  auth_user: null,
}

const gatewayStep = (overrides: Partial<TimelineRow>): TimelineRow => ({
  id: 'gateway-log',
  source: 'edge_logs',
  timestamp: '2026-01-01T10:00:00.000000',
  log_type: 'edge',
  status: '200',
  level: 'success',
  pathname: '/storage/v1/object/avatars/me.png',
  event_message: 'POST | 200',
  method: 'POST',
  auth_user: null,
  metadata: { 'request.headers.cf_ray': '8f00aa-IAD' },
  log_count: null,
  logs: null,
  ...overrides,
})

function renderUser(
  log: ColumnSchema,
  {
    timeline = [],
    users = [],
    flag = true,
    search = createUnifiedLogsSearch(),
    failTimeline = false,
  }: {
    timeline?: TimelineRow[]
    users?: User[]
    flag?: boolean | null
    search?: QuerySearchParamsType
    failTimeline?: boolean
  } = {}
) {
  const logQueries: string[] = []
  const urlUpdates: string[] = []
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
      logQueries.push(sql)
      if (failTimeline)
        return HttpResponse.json<APIErrorBody>(
          { message: 'Correlation unavailable' },
          { status: 500 }
        )
      if (sql.includes('SELECT source, log_attributes')) {
        return HttpResponse.json<LogsResponse>({
          result: [
            {
              source: getLogTypeSource(log.log_type),
              log_attributes: {
                [log.log_type === 'storage' ? 'req.headers.cf_ray' : 'request.headers.cf_ray']:
                  '8f00aa-IAD',
              },
            },
          ],
        })
      }
      return HttpResponse.json<LogsResponse>({ result: timeline })
    },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: () => HttpResponse.json<User[]>(users),
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  customRender(
    <FeatureFlagContext.Provider
      value={{
        configcat: flag === null ? {} : { otelUnifiedLogs: flag },
        posthog: {},
        hasLoaded: true,
      }}
    >
      <FeaturePreviewContextProvider>
        <LogUser row={log} searchParameters={search} />
      </FeaturePreviewContextProvider>
    </FeatureFlagContext.Provider>,
    {
      queryClient,
      nuqs: { onUrlUpdate: ({ queryString }) => urlUpdates.push(queryString) },
    }
  )
  return { logQueries, urlUpdates, queryClient }
}

const user: User = {
  id: USER_ID,
  email: 'ada@example.com',
  providers: ['email', 'github'],
  created_at: '2025-06-01T00:00:00Z',
}

describe('LogUser', () => {
  beforeEach(() => {
    deployment.basePath = ''
    routerMock.setCurrentUrl('/project/default/logs')
  })
  it("shows the log's own user without looking up the rest of the request", async () => {
    const { logQueries } = renderUser({ ...baseLog, auth_user: USER_ID }, { users: [user] })

    expect(await screen.findAllByText('ada@example.com')).toHaveLength(2)
    expect(screen.getByText('A')).toBeVisible()
    expect(screen.getByText('email, github')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'View logs' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open in Authentication' })).toHaveAttribute(
      'href',
      `/project/default/auth/users?show=${USER_ID}`
    )
    expect(logQueries).toEqual([])
  })

  it('preserves the configured deployment base path in the Authentication link', async () => {
    deployment.basePath = '/custom-studio-prefix'
    const { queryClient } = renderUser({ ...baseLog, auth_user: USER_ID }, { users: [user] })
    expect(await screen.findByRole('link', { name: 'Open in Authentication' })).toHaveAttribute(
      'href',
      `${deployment.basePath}/project/default/auth/users?show=${USER_ID}`
    )
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it('finds the user on another log from the same request', async () => {
    renderUser(
      { ...baseLog, id: 'storage-log', log_type: 'storage' },
      { timeline: [gatewayStep({ auth_user: USER_ID })], users: [user] }
    )
    expect(await screen.findAllByText('ada@example.com')).toHaveLength(2)
  })

  it('explains anonymous requests by their role', async () => {
    renderUser(baseLog, {
      timeline: [
        gatewayStep({
          id: 'log-1',
          metadata: { 'request.sb.jwt.authorization.payload.role': 'anon' },
        }),
      ],
    })
    expect(await screen.findByText('No signed-in user')).toBeVisible()
    expect(screen.getByText(/used the anon role/)).toBeVisible()
  })

  it('reports users that no longer exist', async () => {
    renderUser({ ...baseLog, auth_user: USER_ID })
    expect(await screen.findByText('User not found')).toBeVisible()
    expect(screen.queryByRole('link', { name: 'Open in Authentication' })).not.toBeInTheDocument()
  })

  it('filters the list to the user from the User ID row', async () => {
    const userActions = userEvent.setup()
    const { urlUpdates } = renderUser({ ...baseLog, auth_user: USER_ID }, { users: [user] })
    await userActions.click(await screen.findByText('User ID'))
    await userActions.click(await screen.findByRole('menuitem', { name: 'Add filter' }))
    expect(urlUpdates.at(-1)).toContain(`user=${USER_ID}`)
  })

  it('only offers the filter on the User ID row', async () => {
    const userActions = userEvent.setup()
    renderUser({ ...baseLog, auth_user: USER_ID }, { users: [user] })
    await userActions.click(await screen.findByText('Providers'))
    expect(await screen.findByRole('menuitem', { name: /Copy/ })).toBeVisible()
    expect(screen.queryByRole('menuitem', { name: 'Add filter' })).not.toBeInTheDocument()
  })
  it('reports a failed request lookup instead of claiming the request was anonymous', async () => {
    const { queryClient } = renderUser(baseLog, { failTimeline: true })
    expect(await screen.findByText('Failed to retrieve related logs')).toBeVisible()
    expect(screen.getByRole('alert')).toHaveTextContent('Correlation unavailable')
    expect(screen.queryByText('No signed-in user')).not.toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })

  it.each([
    {
      flag: false,
      scope: { filters: [{ column: 'function_id', operator: '=' as const, value: 'fn-1' }] },
      canCorrelate: true,
      name: 'correlates scoped logs with the legacy backend selected',
    },
    {
      flag: false,
      scope: undefined,
      canCorrelate: false,
      name: 'leaves unscoped legacy logs without correlation',
    },
    {
      flag: null,
      scope: undefined,
      canCorrelate: true,
      name: 'correlates logs before the backend flag loads',
    },
  ])('$name', async ({ flag, scope, canCorrelate }) => {
    const { queryClient, logQueries } = renderUser(baseLog, {
      flag,
      search: createUnifiedLogsSearch({}, scope),
      timeline: [gatewayStep({ auth_user: USER_ID })],
      users: [user],
    })
    if (canCorrelate) expect(await screen.findAllByText('ada@example.com')).toHaveLength(2)
    else expect(await screen.findByText('No signed-in user')).toBeVisible()
    expect(logQueries.length > 0).toBe(canCorrelate)
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })
})
