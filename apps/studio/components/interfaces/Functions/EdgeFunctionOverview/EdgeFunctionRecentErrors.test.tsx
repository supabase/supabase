import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EdgeFunctionRecentErrors } from './EdgeFunctionRecentErrors'
import { miscKeys } from '@/data/misc/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']

const { mockIsUnifiedLogsEnabled } = vi.hoisted(() => ({ mockIsUnifiedLogsEnabled: vi.fn() }))

vi.mock('@/components/interfaces/App/FeaturePreview/FeaturePreviewContext', () => ({
  useUnifiedLogsPreview: () => ({ isEnabled: mockIsUnifiedLogsEnabled() }),
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    useParams: () => ({ ref: 'default' }),
    useFlag: (name: string) => name === 'otelUnifiedLogs',
  }
})

const OTEL_ENDPOINT = '/platform/projects/:ref/analytics/endpoints/logs.all.otel'

const errorRow = (index: number, logType = 'edge function runtime') => ({
  id: `log-${index}`,
  timestamp: new Date(Date.now() - index * 60_000).toISOString(),
  log_type: logType,
  status: null,
  level: 'error',
  pathname: null,
  event_message: `TypeError: failure ${index}`,
  method: null,
  log_count: null,
  logs: null,
  auth_user: null,
  metadata: { level: 'error' },
})

const mockLogs = ({
  rows,
  totalErrors,
  invocationCount,
}: {
  rows: ReturnType<typeof errorRow>[]
  totalErrors: number
  invocationCount: number
}) => {
  const rowListSql: string[] = []

  addAPIMock({
    method: 'post',
    path: OTEL_ENDPOINT,
    response: async ({ request }) => {
      const { sql } = (await request.json()) as { sql: string }
      if (sql.includes('-- unified logs: row list')) {
        rowListSql.push(sql)
        return HttpResponse.json<AnalyticsResponse>({ result: rows })
      }
      if (sql.includes('-- unified logs: sidebar facet counts')) {
        return HttpResponse.json<AnalyticsResponse>({
          result: [{ facet: 'total', value: 'all', count: totalErrors }],
        })
      }
      return HttpResponse.json<APIErrorBody>({ message: 'Unexpected SQL' }, { status: 400 })
    },
  })
  addAPIMock({
    method: 'get',
    path: OTEL_ENDPOINT,
    response: () =>
      HttpResponse.json<AnalyticsResponse>({ result: [{ count: String(invocationCount) }] }),
  })

  return { rowListSql }
}

const renderErrors = () => {
  // The AI actions read the selected project and feature overrides
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
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData(miscKeys.enabledFeaturesOverride(), { disabled_features: [] })

  return customRender(
    <EdgeFunctionRecentErrors
      functionId="fn-1"
      functionSlug="hello-world"
      projectRef="default"
      updatedAt={new Date(Date.now() - 60 * 60 * 1000).toISOString()}
    />,
    { queryClient }
  )
}

describe('EdgeFunctionRecentErrors', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/project/default/functions/hello-world')
    mockIsUnifiedLogsEnabled.mockReturnValue(true)
  })

  it("previews the function's latest errors and links the rest to the Logs tab", async () => {
    // Installs the clipboard stub the spy attaches to
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    const { rowListSql } = mockLogs({
      rows: [0, 1, 2, 3, 4, 5].map((index) => errorRow(index)),
      totalErrors: 8,
      invocationCount: 20,
    })

    renderErrors()

    expect(await screen.findByText('TypeError: failure 0')).toBeInTheDocument()
    expect(screen.getByText('TypeError: failure 4')).toBeInTheDocument()
    // A read-only preview: no multi-select checkboxes
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByText('TypeError: failure 5')).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '+3 more' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Explain with AI' })).toBeInTheDocument()

    // The summary is the Assistant prompt: the previewed errors plus how many are left out
    await user.click(screen.getByRole('button', { name: 'Copy summary' }))
    const summary = copy.mock.calls[0][0]
    expect(summary).toContain('I have 5 Supabase log entries from the **Edge Functions** service')
    expect(summary).toContain('TypeError: failure 4')
    expect(summary).not.toContain('TypeError: failure 5')
    expect(summary).toContain('+3 more matching log entries not included.')

    // Scoped to this function's error rows, like the Logs tab it links to
    expect(rowListSql[0]).toContain(`log_attributes['function_id'] = 'fn-1'`)
    expect(rowListSql[0]).toContain(`IN ('error')`)
  })

  it('opens the clicked error in the Logs tab with the same filters', async () => {
    mockLogs({ rows: [0, 1].map((index) => errorRow(index)), totalErrors: 2, invocationCount: 20 })

    renderErrors()

    await userEvent.click(await screen.findByText('TypeError: failure 1'))

    const url = new URL(routerMock.asPath, 'http://localhost')
    expect(url.pathname).toBe('/project/default/functions/hello-world/logs')
    expect(url.searchParams.get('filter')).toBe('level:eq:error')
    expect(url.searchParams.get('id')).toBe('log-1')
    expect(url.searchParams.get('date')).toMatch(/^\d+-\d+$/)
    expect(screen.queryByRole('button', { name: /more$/ })).not.toBeInTheDocument()
  })

  it('opens errors in the pre-unified Invocations or Logs tab when unified logs are off', async () => {
    mockIsUnifiedLogsEnabled.mockReturnValue(false)
    mockLogs({
      rows: [errorRow(0), errorRow(1, 'edge function')],
      totalErrors: 2,
      invocationCount: 20,
    })

    renderErrors()

    await userEvent.click(await screen.findByText('TypeError: failure 0'))
    const runtimeUrl = new URL(routerMock.asPath, 'http://localhost')
    expect(runtimeUrl.pathname).toBe('/project/default/functions/hello-world/logs')
    expect(runtimeUrl.searchParams.get('log')).toBe('log-0')
    expect(runtimeUrl.searchParams.get('its')).toBeTruthy()
    expect(runtimeUrl.searchParams.get('ite')).toBeTruthy()

    await userEvent.click(screen.getByText('TypeError: failure 1'))
    const invocationUrl = new URL(routerMock.asPath, 'http://localhost')
    expect(invocationUrl.pathname).toBe('/project/default/functions/hello-world/invocations')
    expect(invocationUrl.searchParams.get('log')).toBe('log-1')
  })

  it('summarizes invocations since the last deploy when there are no errors', async () => {
    mockLogs({ rows: [], totalErrors: 0, invocationCount: 3 })

    renderErrors()

    expect(await screen.findByText('3 invocations')).toBeInTheDocument()
    expect(screen.getByText(/since last deploy and no errors/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy summary' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument()
  })
})
