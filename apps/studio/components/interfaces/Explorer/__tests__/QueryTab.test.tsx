import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerQueryTab } from '../ExplorerQueryTab'
import type { ReadReplicasData } from '@/data/read-replicas/replicas-query'
import { explorerQueryState } from '@/state/explorer-query'
import { createTabId, createTabsState, TabsStateContext } from '@/state/tabs'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { setupSqlEditorMocks } from '@/tests/lib/sql-editor-test-utils'

const testContext = vi.hoisted(() => ({
  flags: { otelLegacyLogs: true } as Record<string, boolean>,
  params: { ref: 'default', id: 'query-test' } as { ref?: string; id?: string },
}))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    IS_PLATFORM: true,
    useParams: () => testContext.params,
    useFlag: (flag: string) => testContext.flags[flag] ?? false,
  }
})

vi.mock('@/components/ui/CodeEditor/CodeEditor', () => ({
  CodeEditor: ({
    value,
    onInputChange,
  }: {
    value: string
    onInputChange?: (value: string | undefined) => void
  }) => (
    <textarea
      aria-label="SQL editor"
      value={value}
      onChange={(e) => onInputChange?.(e.target.value)}
    />
  ),
}))

vi.mock('../QueryEditor/QuerySourceMenu', () => ({
  QuerySourceMenu: ({
    roleImpersonationState,
  }: {
    roleImpersonationState?: { role?: { type: string; role?: string } }
  }) => (
    <div data-testid="impersonated-role">
      {roleImpersonationState?.role?.type === 'postgrest'
        ? roleImpersonationState.role.role
        : 'none'}
    </div>
  ),
}))

const renderQueryTab = (tabsState = createTabsState('default')) =>
  customRender(
    <TabsStateContext.Provider value={tabsState}>
      <ExplorerQueryTab />
    </TabsStateContext.Provider>
  )

const createDraft = (
  source:
    | { _tag: 'database'; database_identifier?: string }
    | {
        _tag: 'logs'
        time_range: { _tag: 'relative_time_range'; amount: number; unit: 'hour' }
      },
  sql: string = 'select 1'
) => {
  explorerQueryState.removeDraft({ id: 'query-test', projectRef: 'default' })
  explorerQueryState.createDraft({
    id: 'query-test',
    projectRef: 'default',
    sql,
    source,
  })
}

beforeEach(() => {
  setupSqlEditorMocks()
  testContext.flags.otelLegacyLogs = true
  testContext.params = { ref: 'default', id: 'query-test' }
  explorerQueryState.removeDraft({ id: 'query-test', projectRef: 'default' })
})

afterEach(() => explorerQueryState.flushPendingPersistence())

describe('QueryTab execution', () => {
  it('keeps loading while dynamic route parameters are unavailable', () => {
    testContext.params = {}

    renderQueryTab()

    expect(screen.getByRole('status', { name: 'Loading query' })).toBeInTheDocument()
    expect(screen.queryByText('Query draft not found')).not.toBeInTheDocument()
  })

  it('records an unavailable error and skips the logs endpoint when the flag is off', async () => {
    testContext.flags.otelLegacyLogs = false
    createDraft({
      _tag: 'logs',
      time_range: { _tag: 'relative_time_range', amount: 1, unit: 'hour' },
    })
    const requests: Request[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: ({ request }) => {
        requests.push(request)
        return HttpResponse.json({ result: [] })
      },
    })

    renderQueryTab()
    const runButton = await screen.findByRole('button', { name: 'Run' })
    await waitFor(() => expect(runButton).toBeEnabled())
    await userEvent.click(runButton)

    expect(
      await screen.findByText("Error: Querying logs isn't available for this project yet.")
    ).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('waits for replicas, then fails closed when the selected database is absent', async () => {
    createDraft({ _tag: 'database', database_identifier: 'missing-replica' })
    let releaseReplicas: () => void = () => undefined
    const replicasPending = new Promise<void>((resolve) => {
      releaseReplicas = resolve
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/databases',
      response: async () => {
        await replicasPending
        return HttpResponse.json<ReadReplicasData>([])
      },
    })
    // `useAddDefinitions` fires its own background keywords/functions/schemas/table-columns
    // fetches against this same generic pg-meta query endpoint (differentiated by the `key`
    // search param) as soon as the editor mounts — those are expected and unrelated to the
    // actual run. Only a request with no recognized intellisense `key` counts as an execution.
    const INTELLISENSE_KEYS = ['keywords', 'database-functions', 'schemas', 'table-columns']
    const requests: Request[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: ({ request }) => {
        const key = new URL(request.url).searchParams.get('key')
        if (!key || !INTELLISENSE_KEYS.includes(key)) requests.push(request)
        return HttpResponse.json([])
      },
    })

    renderQueryTab()
    const runButton = await screen.findByRole('button', { name: 'Run' })
    expect(runButton).toBeDisabled()

    act(() => releaseReplicas())
    await waitFor(() => expect(runButton).toBeEnabled())
    await userEvent.click(runButton)

    expect(
      await screen.findByText('Error: Unable to run query: Connection string is missing')
    ).toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  it('resolves a relative logs range before sending the request', async () => {
    createDraft({
      _tag: 'logs',
      time_range: { _tag: 'relative_time_range', amount: 2, unit: 'hour' },
    })
    const bodies: Array<{ iso_timestamp_start: string; iso_timestamp_end: string }> = []
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: async ({ request }) => {
        bodies.push((await request.json()) as (typeof bodies)[number])
        return HttpResponse.json({ result: [] })
      },
    })

    renderQueryTab()
    const runButton = await screen.findByRole('button', { name: 'Run' })
    await waitFor(() => expect(runButton).toBeEnabled())
    await userEvent.click(runButton)
    await waitFor(() => expect(bodies).toHaveLength(1))

    expect(
      new Date(bodies[0].iso_timestamp_end).getTime() -
        new Date(bodies[0].iso_timestamp_start).getTime()
    ).toBe(2 * 60 * 60 * 1000)
  })

  it('isolates the impersonated role selection per query tab', async () => {
    createDraft({ _tag: 'database' })
    explorerQueryState.removeDraft({ id: 'query-test-2', projectRef: 'default' })
    explorerQueryState.createDraft({ id: 'query-test-2', projectRef: 'default', sql: 'select 2' })
    explorerQueryState.setRole({
      id: 'query-test',
      role: { type: 'postgrest', role: 'service_role' },
    })

    const { rerender } = renderQueryTab()
    expect(await screen.findByTestId('impersonated-role')).toHaveTextContent('service_role')

    testContext.params = { ref: 'default', id: 'query-test-2' }
    rerender(
      <TabsStateContext.Provider value={createTabsState('default')}>
        <ExplorerQueryTab />
      </TabsStateContext.Provider>
    )

    expect(await screen.findByTestId('impersonated-role')).toHaveTextContent('none')

    await act(async () => {
      explorerQueryState.removeDraft({ id: 'query-test-2', projectRef: 'default' })
    })
  })

  it('persists the preview tab once typing starts in the SQL editor', async () => {
    createDraft({ _tag: 'database' })

    const tabsState = createTabsState('default')
    const tabId = createTabId('query', { id: 'query-test' })
    tabsState.addTab({ id: tabId, type: 'query', metadata: { queryId: 'query-test' } })
    expect(tabsState.tabsMap[tabId]?.isPreview).toBe(true)

    renderQueryTab(tabsState)

    const sqlEditor = await screen.findByRole('textbox', { name: 'SQL editor' })
    await userEvent.type(sqlEditor, ' where true')

    await waitFor(() => expect(tabsState.tabsMap[tabId]?.isPreview).toBe(false))
  })

  it('blocks a destructive query behind a confirmation modal, then runs it once confirmed', async () => {
    createDraft({ _tag: 'database' }, 'delete from foo')
    const executedQueries: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = (await request.json()) as { query: string }
        if (query.trim().toLowerCase().startsWith('delete')) executedQueries.push(query)
        return HttpResponse.json([])
      },
    })

    renderQueryTab()
    const runButton = await screen.findByRole('button', { name: 'Run' })
    await waitFor(() => expect(runButton).toBeEnabled())
    await userEvent.click(runButton)

    expect(await screen.findByText('Potential issue detected')).toBeInTheDocument()
    expect(executedQueries).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'Run query' }))

    await waitFor(() => expect(executedQueries).toHaveLength(1))
  })

  it('cancels a blocked query without running it', async () => {
    createDraft({ _tag: 'database' }, 'update foo set bar = 1')
    const executedQueries: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = (await request.json()) as { query: string }
        if (query.trim().toLowerCase().startsWith('update')) executedQueries.push(query)
        return HttpResponse.json([])
      },
    })

    renderQueryTab()
    const runButton = await screen.findByRole('button', { name: 'Run' })
    await waitFor(() => expect(runButton).toBeEnabled())
    await userEvent.click(runButton)

    expect(await screen.findByText('Potential issue detected')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Potential issue detected')).not.toBeInTheDocument()
    expect(executedQueries).toHaveLength(0)
  })

  it('runs a CREATE TABLE query with RLS enabled once "Run and enable RLS" is chosen', async () => {
    createDraft({ _tag: 'database' }, 'create table foo (id int)')
    const executedQueries: string[] = []
    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: async ({ request }) => {
        const { query } = (await request.json()) as { query: string }
        if (query.trim().toLowerCase().startsWith('create table')) executedQueries.push(query)
        return HttpResponse.json([])
      },
    })

    renderQueryTab()
    const runButton = await screen.findByRole('button', { name: 'Run' })
    await waitFor(() => expect(runButton).toBeEnabled())
    await userEvent.click(runButton)

    expect(await screen.findByText('Potential issue detected')).toBeInTheDocument()
    expect(executedQueries).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'Run and enable RLS' }))

    await waitFor(() => expect(executedQueries).toHaveLength(1))
    expect(executedQueries[0]).toContain('create table foo (id int)')
    expect(executedQueries[0]).toContain('ALTER TABLE foo ENABLE ROW LEVEL SECURITY;')
  })
})
