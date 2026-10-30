import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents } from 'api-types'
import { FeatureFlagContext } from 'common'
import { HttpResponse } from 'msw'
import { createDynamicRouteParser } from 'next-router-mock/dynamic-routes'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { UserRecentLogs } from './UserRecentLogs'
import { FeaturePreviewContextProvider } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import type { UnifiedLogsQueryRow } from '@/data/logs/unified-logs.utils'
import { miscKeys } from '@/data/misc/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type LogsResponse = platformComponents['schemas']['AnalyticsResponse_Output']

vi.unmock('common')
const { default: routerMock } =
  await vi.importMock<typeof import('next-router-mock')>('next/router')
const removeRouteParser = routerMock.useParser(createDynamicRouteParser(['/project/[ref]/logs']))
afterAll(removeRouteParser)
const requestSchema = z.object({ sql: z.string() })

const USER_ID = '6f1c1a8e-4a0b-4c1e-9b1e-2f3a4b5c6d7e'

const listRow = (id: string, timestamp: string, pathname: string): UnifiedLogsQueryRow => ({
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

function renderRecentLogs(
  rows: UnifiedLogsQueryRow[],
  nextUserRows?: Promise<UnifiedLogsQueryRow[]>
) {
  const queries: string[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
    response: async ({ request }) => {
      const { sql } = requestSchema.parse(await request.json())
      queries.push(sql)
      return HttpResponse.json<LogsResponse>({
        result: sql.includes(USER_ID) ? rows : ((await nextUserRows) ?? []),
      })
    },
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(miscKeys.enabledFeaturesOverride(), { disabled_features: [] })
  const content = (userId: string) => (
    <FeatureFlagContext.Provider
      value={{ configcat: { otelUnifiedLogs: true }, posthog: {}, hasLoaded: true }}
    >
      <FeaturePreviewContextProvider>
        <UserRecentLogs userId={userId} />
      </FeaturePreviewContextProvider>
    </FeatureFlagContext.Provider>
  )
  const rendered = customRender(content(USER_ID), { queryClient })
  return {
    ...rendered,
    queries,
    queryClient,
    selectUser: (userId: string) => rendered.rerender(content(userId)),
  }
}

describe('UserRecentLogs', () => {
  beforeEach(() => routerMock.setCurrentUrl('/project/default/logs'))
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

  it('opens all logs filtered to the selected user', async () => {
    renderRecentLogs([listRow('log-1', '2026-01-02T09:00:00.000000', '/rest/v1/todos')])

    await userEvent.click(await screen.findByRole('button', { name: 'View more in Logs' }))
    const logsUrl = new URL(routerMock.asPath, 'http://localhost')
    expect(logsUrl.searchParams.get('user')).toBe(USER_ID)
    expect(logsUrl.searchParams.has('id')).toBe(false)
  })

  it('shows an empty state when the user has no recent logs', async () => {
    renderRecentLogs([])
    expect(await screen.findByText('No logs in the last 24 hours')).toBeVisible()
  })
  it("clears the previous user's rows while the next user's logs load", async () => {
    const nextUser = '22222222-2222-4222-8222-222222222222'
    const response = Promise.withResolvers<UnifiedLogsQueryRow[]>()
    const { selectUser, queries, queryClient } = renderRecentLogs(
      [listRow('first-log', '2026-01-02T09:00:00.000000', '/first-user')],
      response.promise
    )
    expect(await screen.findByText('/first-user')).toBeVisible()
    selectUser(nextUser)
    await waitFor(() => expect(queries.some((sql) => sql.includes(nextUser))).toBe(true))
    expect(screen.queryByText('/first-user')).not.toBeInTheDocument()
    expect(screen.queryByText('No logs in the last 24 hours')).not.toBeInTheDocument()
    response.resolve([
      { ...listRow('next-log', '2026-01-02T09:00:00.000000', '/next-user'), auth_user: nextUser },
    ])
    expect(await screen.findByText('/next-user')).toBeVisible()
    expect(screen.queryByText('/first-user')).not.toBeInTheDocument()
    await waitFor(() => expect(queryClient.isFetching()).toBe(0))
  })
})
