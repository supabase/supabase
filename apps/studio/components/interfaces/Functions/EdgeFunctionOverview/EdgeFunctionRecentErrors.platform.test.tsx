import { QueryClient } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { platformComponents } from 'api-types'
import { FeatureFlagContext, LOCAL_STORAGE_KEYS } from 'common'
import { http, HttpResponse } from 'msw'
import { createDynamicRouteParser } from 'next-router-mock/dynamic-routes'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { EdgeFunctionRecentErrors } from './EdgeFunctionRecentErrors'
import { FeaturePreviewContextProvider } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { miscKeys } from '@/data/misc/keys'
import { AiAssistantStateContext, createAiAssistantState } from '@/state/ai-assistant-state'
import { sidebarManagerState } from '@/state/sidebar-manager-state'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer, type APIErrorBody } from '@/tests/lib/msw'

type AnalyticsResponse = platformComponents['schemas']['AnalyticsResponse_Output']

vi.unmock('common')

const { default: routerMock } =
  await vi.importMock<typeof import('next-router-mock')>('next/router')

const removeRouteParser = routerMock.useParser(
  createDynamicRouteParser(['/project/[ref]/functions/[functionSlug]'])
)
afterAll(removeRouteParser)

const featureFlags = {
  configcat: {
    otelUnifiedLogs: true,
    otelLegacyLogs: true,
    pipelineCreationWizard: false,
    platformWebhooks: false,
    jitDbAccess: false,
    marketplaceIntegrations: false,
    explorer: false,
    storageVersioningPrivateAlpha: false,
    sqlEditorManualSaveForced: false,
  },
  posthog: {},
  hasLoaded: true,
}

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
  const countSql: string[] = []

  addAPIMock({
    method: 'post',
    path: OTEL_ENDPOINT,
    response: async ({ request }) => {
      const { sql } = z.object({ sql: z.string() }).parse(await request.json())
      if (sql.includes('-- unified logs: row list')) {
        rowListSql.push(sql)
        const limit = Number(sql.match(/LIMIT (\d+)$/)?.[1] ?? rows.length)
        return HttpResponse.json<AnalyticsResponse>({ result: rows.slice(0, limit) })
      }
      if (sql.includes('-- unified logs: sidebar facet counts')) {
        countSql.push(sql)
        return HttpResponse.json<AnalyticsResponse>({
          result: [
            { facet: 'total', value: 'all', count: totalErrors + invocationCount },
            { facet: 'level', value: 'error', count: totalErrors },
            { facet: 'log_type', value: 'edge function', count: invocationCount },
          ],
        })
      }
      return HttpResponse.json<APIErrorBody>({ message: 'Unexpected SQL' }, { status: 400 })
    },
  })

  return { rowListSql, countSql }
}

const renderErrors = () => {
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

  const aiState = createAiAssistantState()
  const content = (functionId: string) => (
    <FeatureFlagContext.Provider value={featureFlags}>
      <FeaturePreviewContextProvider>
        <AiAssistantStateContext.Provider value={aiState}>
          <EdgeFunctionRecentErrors
            functionId={functionId}
            functionSlug="hello-world"
            projectRef="default"
            updatedAt={new Date(Date.now() - 60 * 60 * 1000).toISOString()}
          />
        </AiAssistantStateContext.Provider>
      </FeaturePreviewContextProvider>
    </FeatureFlagContext.Provider>
  )
  const rendered = customRender(content('fn-1'), { queryClient })
  return {
    ...rendered,
    renderFunction: (functionId: string) => rendered.rerender(content(functionId)),
  }
}

describe('EdgeFunctionRecentErrors', () => {
  beforeEach(() => {
    routerMock.setCurrentUrl('/project/default/functions/hello-world')
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS, 'true')
  })

  afterEach(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS)
    sidebarManagerState.unregisterSidebar('ai-assistant')
  })

  it("previews the function's latest errors and links the rest to the Logs tab", async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    const { rowListSql, countSql } = mockLogs({
      rows: [0, 1, 2, 3, 4, 5].map((index) => errorRow(index)),
      totalErrors: 8,
      invocationCount: 20,
    })

    renderErrors()

    expect(await screen.findByText('TypeError: failure 0')).toBeInTheDocument()
    expect(screen.getByText('TypeError: failure 4')).toBeInTheDocument()

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByText('TypeError: failure 5')).not.toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '+3 more' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Explain with AI' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Copy summary' }))
    const summary = copy.mock.calls[0][0]
    expect(summary).toContain('I have 5 Supabase log entries from the **Edge Functions** service')
    expect(summary).toContain('TypeError: failure 4')
    expect(summary).not.toContain('TypeError: failure 5')
    expect(summary).toContain('+3 more matching log entries not included.')

    expect(rowListSql[0]).toContain(`log_attributes['function_id'] IN ('fn-1')`)
    expect(rowListSql[0]).toContain(`IN ('error')`)
    expect(rowListSql[0]).toMatch(/LIMIT 5$/)

    expect(countSql).toHaveLength(1)
    expect(countSql[0]).toContain(`log_attributes['function_id'] IN ('fn-1')`)
    expect(countSql[0]).not.toContain(`IN ('error')`)
  })

  it('opens the clicked error in the Logs tab with the same filters', async () => {
    mockLogs({ rows: [0, 1].map((index) => errorRow(index)), totalErrors: 2, invocationCount: 20 })

    renderErrors()

    await userEvent.click(await screen.findByText('TypeError: failure 1'))

    await waitFor(() => expect(routerMock.query.id).toBe('log-1'))
    const url = new URL(routerMock.asPath, 'http://localhost')
    expect(url.pathname).toBe('/project/default/functions/hello-world/logs')
    expect(url.searchParams.get('filter')).toBe('level:eq:error')
    expect(url.searchParams.get('id')).toBe('log-1')
    expect(url.searchParams.get('date')).toMatch(/^\d+-\d+$/)
    expect(screen.queryByRole('button', { name: /more$/ })).not.toBeInTheDocument()
  })

  it('opens errors in the pre-unified Invocations or Logs tab when unified logs are off', async () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS, 'false')
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

  it('shows a retrieval error without offering summaries of unavailable errors', async () => {
    addAPIMock({
      method: 'post',
      path: OTEL_ENDPOINT,
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Function logs unavailable' }, { status: 500 }),
    })

    renderErrors()

    expect(await screen.findByText(/Failed to retrieve logs/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Copy summary' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument()
    expect(screen.queryByText(/since last deploy and no errors/)).not.toBeInTheDocument()
  })

  it('clears the previous function errors and summaries while another function loads', async () => {
    mockLogs({ rows: [errorRow(0)], totalErrors: 1, invocationCount: 20 })
    const { renderFunction } = renderErrors()
    expect(await screen.findByText('TypeError: failure 0')).toBeInTheDocument()

    let releaseResponse: () => void = () => {}
    const pendingResponse = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    addAPIMock({
      method: 'post',
      path: OTEL_ENDPOINT,
      response: async ({ request }) => {
        const { sql } = z.object({ sql: z.string() }).parse(await request.json())
        if (sql.includes('sidebar facet counts'))
          return HttpResponse.json<AnalyticsResponse>({ result: [] })
        await pendingResponse
        return HttpResponse.json<AnalyticsResponse>({ result: [errorRow(1)] })
      },
    })

    try {
      renderFunction('fn-2')
      expect(screen.queryByText('TypeError: failure 0')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Copy summary' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Explain with AI' })).not.toBeInTheDocument()
    } finally {
      releaseResponse()
    }
    expect(await screen.findByText('TypeError: failure 1')).toBeInTheDocument()
  })

  it('opens the Assistant with the same preview summary copied for external AI tools', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    mockLogs({ rows: [errorRow(0)], totalErrors: 3, invocationCount: 20 })
    const submittedMessages: Array<{ parts: Array<{ type: string; text?: string }> }> = []
    mswServer.use(
      http.post('/api/ai/sql/generate-v4', async ({ request }) => {
        const { messages } = z
          .object({
            messages: z.array(
              z.object({
                parts: z.array(z.object({ type: z.string(), text: z.string().optional() })),
              })
            ),
          })
          .parse(await request.json())
        submittedMessages.push(...messages)
        return new HttpResponse('data: [DONE]\n\n', {
          headers: { 'content-type': 'text/event-stream', 'x-vercel-ai-ui-message-stream': 'v1' },
        })
      })
    )
    sidebarManagerState.registerSidebar('ai-assistant', () => null)
    renderErrors()

    await screen.findByText('TypeError: failure 0')
    await user.click(screen.getByRole('button', { name: 'Copy summary' }))
    await user.click(screen.getByRole('button', { name: 'Explain with AI' }))

    expect(sidebarManagerState.activeSidebar?.id).toBe('ai-assistant')
    await waitFor(() => {
      expect(submittedMessages).toHaveLength(1)
      expect(submittedMessages[0].parts).toEqual([{ type: 'text', text: copy.mock.calls[0][0] }])
    })
  })
})
