import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { UserRecentLogs } from './UserRecentLogs'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

type LogsResponse = platformComponents['schemas']['AnalyticsResponse_Output']

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ ref: 'default' }),
    useFlag: (name: string) => name === 'otelUnifiedLogs',
  }
})

const USER_ID = '6f1c1a8e-4a0b-4c1e-9b1e-2f3a4b5c6d7e'

const listRow = (id: string, timestamp: string, pathname: string) => ({
  id,
  timestamp,
  log_type: 'edge',
  status: '200',
  level: 'success',
  pathname,
  event_message: `GET | 200 | ${pathname}`,
  method: 'GET',
  log_count: null,
  logs: null,
  auth_user: USER_ID,
  metadata: null,
})

function renderRecentLogs(rows: unknown[]) {
  const queries: string[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
    response: async ({ request }) => {
      const { sql } = (await request.json()) as { sql: string }
      queries.push(sql)
      return HttpResponse.json<LogsResponse>({ result: rows })
    },
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  customRender(<UserRecentLogs userId={USER_ID} />, { queryClient })
  return { queries }
}

describe('UserRecentLogs', () => {
  it("lists the user's recent logs and opens one on the logs page", async () => {
    const { queries } = renderRecentLogs([
      listRow('log-2', '2026-01-02T09:30:00.000000', '/rest/v1/todos'),
      listRow('log-1', '2026-01-02T09:00:00.000000', '/rest/v1/notes'),
    ])

    await userEvent.click(await screen.findByText('/rest/v1/todos'))
    const logUrl = new URL(routerMock.asPath, 'http://localhost')
    expect(logUrl.pathname).toBe('/project/default/logs')
    expect(logUrl.searchParams.get('user')).toBe(USER_ID)
    expect(logUrl.searchParams.get('id')).toBe('log-2')

    expect(screen.getByText('/rest/v1/notes')).toBeInTheDocument()
    expect(queries.some((sql) => sql.includes(`'${USER_ID}'`))).toBe(true)
  })

  it('links to the rest of their logs', async () => {
    renderRecentLogs([listRow('log-1', '2026-01-02T09:00:00.000000', '/rest/v1/todos')])

    await userEvent.click(await screen.findByRole('button', { name: 'View more in Logs' }))
    const logsUrl = new URL(routerMock.asPath, 'http://localhost')
    expect(logsUrl.searchParams.get('user')).toBe(USER_ID)
    expect(logsUrl.searchParams.has('id')).toBe(false)
  })

  it('explains an empty list', async () => {
    renderRecentLogs([])
    expect(await screen.findByText('No logs in the last 24 hours')).toBeVisible()
  })
})
