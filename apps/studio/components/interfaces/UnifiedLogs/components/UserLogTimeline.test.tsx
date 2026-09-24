import { QueryClient } from '@tanstack/react-query'
import { screen, within } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { UserLogTimeline } from './UserLogTimeline'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

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

const listRow = (id: string, timestamp: string) => ({
  id,
  timestamp,
  log_type: 'edge',
  status: '200',
  level: 'success',
  pathname: '/rest/v1/todos',
  event_message: 'GET | 200 | /rest/v1/todos',
  method: 'GET',
  log_count: null,
  logs: null,
  auth_user: USER_ID,
  metadata: null,
})

function renderTimeline(rows: unknown[]) {
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
  customRender(<UserLogTimeline userId={USER_ID} />, { queryClient })
  return { queries }
}

describe('UserLogTimeline', () => {
  it("lists the user's recent logs, each linking to it on the logs page", async () => {
    const { queries } = renderTimeline([
      listRow('log-2', '2026-01-02T09:30:00.000000'),
      listRow('log-1', '2026-01-02T09:00:00.000000'),
    ])

    const list = await screen.findByRole('list', { name: 'User logs' })
    const [latest, earlier, viewMore] = within(list).getAllByRole('link')

    const latestParams = new URL(latest.getAttribute('href')!, 'https://x').searchParams
    expect(latestParams.get('user')).toBe(USER_ID)
    expect(latestParams.get('id')).toBe('log-2')
    expect(earlier).toHaveTextContent('GET/rest/v1/todos')

    expect(viewMore).toHaveTextContent('View more in Logs')
    const viewMoreParams = new URL(viewMore.getAttribute('href')!, 'https://x').searchParams
    expect(viewMoreParams.get('user')).toBe(USER_ID)
    expect(viewMoreParams.has('id')).toBe(false)

    expect(queries.some((sql) => sql.includes(`'${USER_ID}'`))).toBe(true)
  })

  it('explains an empty timeline', async () => {
    renderTimeline([])
    expect(await screen.findByText('No logs in the last 24 hours')).toBeVisible()
  })
})
