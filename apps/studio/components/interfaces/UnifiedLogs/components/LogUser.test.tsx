import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { ColumnSchema } from '../UnifiedLogs.schema'
import { LogUser } from './LogUser'
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

const gatewayStep = (overrides: Record<string, unknown>) => ({
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
  { timeline = [], users = [] }: { timeline?: unknown[]; users?: unknown[] } = {}
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
      const { sql } = (await request.json()) as { sql: string }
      logQueries.push(sql)
      if (sql.includes('log attributes')) {
        return HttpResponse.json<LogsResponse>({
          result: [
            { source: 'edge_logs', log_attributes: { 'request.headers.cf_ray': '8f00aa-IAD' } },
          ],
        })
      }
      return HttpResponse.json<LogsResponse>({ result: timeline })
    },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: () => HttpResponse.json<unknown[]>(users),
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  customRender(<LogUser row={log} />, {
    queryClient,
    nuqs: { onUrlUpdate: ({ queryString }) => urlUpdates.push(queryString) },
  })
  return { logQueries, urlUpdates }
}

const user = {
  id: USER_ID,
  email: 'ada@example.com',
  providers: ['email', 'github'],
  created_at: '2025-06-01T00:00:00Z',
}

describe('LogUser', () => {
  it("shows the log's own user without looking up the rest of the request", async () => {
    const { logQueries } = renderUser({ ...baseLog, auth_user: USER_ID }, { users: [user] })

    // The card leads with the email when there's no display name, and the fields repeat it
    expect(await screen.findAllByText('ada@example.com')).toHaveLength(2)
    expect(screen.getByText('A')).toBeVisible()
    expect(screen.getByText('email, github')).toBeVisible()
    expect(screen.queryByRole('button', { name: 'View logs' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open in Authentication' })).toHaveAttribute(
      'href',
      expect.stringContaining(`/project/default/auth/users?show=${USER_ID}`)
    )
    expect(logQueries).toEqual([])
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
})
