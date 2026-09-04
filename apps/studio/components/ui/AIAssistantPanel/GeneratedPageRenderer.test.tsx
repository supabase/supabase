import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { GeneratedPageRenderer } from './GeneratedPageRenderer'
import {
  explorerGeneratedPageState,
  removeExplorerGeneratedPage,
} from '@/state/explorer-generated-page'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const { mockRouterPush } = vi.hoisted(() => ({ mockRouterPush: vi.fn() }))

vi.mock('next/router', async () => {
  const actual = await vi.importActual<typeof import('next-router-mock')>('next-router-mock')
  return { ...actual, useRouter: () => ({ ...actual.default, push: mockRouterPush }) }
})

const PROJECT_REF = 'default'

const input = {
  title: 'Auth debugging console',
  html: '<h1 id="page-heading">Auth console</h1>',
  database_queries: [
    { id: 'recent_users', title: 'Recent users', sql: 'select id from auth.users', row_limit: 25 },
  ],
  log_queries: [
    {
      id: 'auth_errors',
      title: 'Auth errors',
      sql: "select timestamp from logs where source = 'auth_logs' limit 100",
      time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 1 },
    },
  ],
  enable_supabase_client: true,
}

const getFrame = () => document.querySelector('[data-testid="generated-page-frame"]')

beforeEach(() => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: {
      ref: PROJECT_REF,
      name: 'Default',
      connectionString: 'postgres://encrypted',
    } as never,
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/settings',
    response: {
      app_config: { protocol: 'https', endpoint: `${PROJECT_REF}.supabase.co` },
    } as never,
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/billing/addons',
    response: { selected_addons: [], available_addons: [] } as never,
  })
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/custom-hostname',
    response: { status: '0_not_started' } as never,
  })
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: [
      { id: 'pk', name: 'default', type: 'publishable', api_key: 'sb_publishable_abc' },
      { id: 'sk', name: 'secret', type: 'secret', api_key: 'sb_secret_abc' },
      { id: 'legacy', name: 'service_role', type: 'legacy', api_key: 'service-role-jwt' },
    ] as never,
  })
})

afterEach(() => {
  mockRouterPush.mockClear()
  for (const id of Object.keys(explorerGeneratedPageState.pages)) removeExplorerGeneratedPage(id)
})

describe('GeneratedPageRenderer', () => {
  it('does not mount the iframe before the user approves', async () => {
    customRender(
      <GeneratedPageRenderer
        state="approval-requested"
        input={input}
        confirmState="approval-requested"
      />
    )

    expect(await screen.findByText('Auth debugging console')).toBeInTheDocument()
    expect(getFrame()).toBeNull()
  })

  it('shows what the page will be able to do before it runs', async () => {
    customRender(
      <GeneratedPageRenderer
        state="approval-requested"
        input={input}
        confirmState="approval-requested"
      />
    )

    expect(
      await screen.findByText('1 database query · 1 logs query · Supabase client, subject to RLS')
    ).toBeInTheDocument()
    expect(screen.getByText('Database queries (1)')).toBeInTheDocument()
    expect(screen.getByText('Logs queries (1)')).toBeInTheDocument()
  })

  it('mounts a script-only sandboxed frame once the user approves, and reports the approval', async () => {
    const user = userEvent.setup()
    const onApprove = vi.fn()

    customRender(
      <GeneratedPageRenderer
        state="approval-requested"
        input={input}
        confirmState="approval-requested"
        onApprove={onApprove}
      />
    )

    await user.click(await screen.findByRole('button', { name: 'Run page' }))

    await waitFor(() => expect(getFrame()).not.toBeNull())
    expect(onApprove).toHaveBeenCalledTimes(1)

    const frame = getFrame() as HTMLIFrameElement
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts')
    expect(frame.srcdoc).toContain('<h1 id="page-heading">Auth console</h1>')
  })

  it('never places a secret or service key in the frame', async () => {
    const user = userEvent.setup()

    customRender(
      <GeneratedPageRenderer
        state="approval-requested"
        input={input}
        confirmState="approval-requested"
      />
    )

    await user.click(await screen.findByRole('button', { name: 'Run page' }))
    await waitFor(() => expect(getFrame()).not.toBeNull())

    const srcdoc = (getFrame() as HTMLIFrameElement).srcdoc
    expect(srcdoc).not.toContain('sb_secret_abc')
    expect(srcdoc).not.toContain('service-role-jwt')
    expect(srcdoc).not.toContain('postgres://encrypted')
  })

  it('destroys the frame when the user stops the page', async () => {
    const user = userEvent.setup()

    customRender(
      <GeneratedPageRenderer
        state="approval-requested"
        input={input}
        confirmState="approval-requested"
      />
    )

    await user.click(await screen.findByRole('button', { name: 'Run page' }))
    await waitFor(() => expect(getFrame()).not.toBeNull())

    await user.click(screen.getByRole('button', { name: 'Stop' }))

    expect(getFrame()).toBeNull()
  })

  it('builds the client from the legacy anon key when the project has no publishable key', async () => {
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys',
      response: [
        { id: 'anon', name: 'anon', type: 'legacy', api_key: 'anon-jwt' },
        { id: 'sr', name: 'service_role', type: 'legacy', api_key: 'service-role-jwt' },
      ] as never,
    })
    const user = userEvent.setup()

    customRender(
      <GeneratedPageRenderer
        state="approval-requested"
        input={input}
        confirmState="approval-requested"
      />
    )

    await waitFor(() =>
      expect(screen.queryByText('Running without a Supabase client')).not.toBeInTheDocument()
    )
    await user.click(screen.getByRole('button', { name: 'Run page' }))
    await waitFor(() => expect(getFrame()).not.toBeNull())

    const srcdoc = (getFrame() as HTMLIFrameElement).srcdoc
    expect(srcdoc).toContain('anon-jwt')
    expect(srcdoc).not.toContain('service-role-jwt')
  })

  it('says why the client is missing when the project has no eligible key', async () => {
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys',
      response: [
        { id: 'sr', name: 'service_role', type: 'legacy', api_key: 'service-role-jwt' },
      ] as never,
    })

    customRender(
      <GeneratedPageRenderer
        state="approval-requested"
        input={input}
        confirmState="approval-requested"
      />
    )

    expect(
      await screen.findByText(
        'This project has no publishable or anon key to build a client with.',
        {
          exact: false,
        }
      )
    ).toBeInTheDocument()
  })

  it('warns when the page calls window.supabase without requesting the client', async () => {
    customRender(
      <GeneratedPageRenderer
        state="approval-requested"
        input={{
          ...input,
          enable_supabase_client: false,
          html: '<script>window.supabase.from("x")</script>',
        }}
        confirmState="approval-requested"
      />
    )

    expect(
      await screen.findByText('This page uses a Supabase client it did not request')
    ).toBeInTheDocument()
  })

  it('offers Expand only once the page is running', async () => {
    const user = userEvent.setup()

    customRender(
      <GeneratedPageRenderer
        state="approval-requested"
        input={input}
        confirmState="approval-requested"
      />
    )

    expect(await screen.findByText('Auth debugging console')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Expand' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Run page' }))
    await waitFor(() => expect(getFrame()).not.toBeNull())

    expect(screen.getByRole('button', { name: 'Expand' })).toBeInTheDocument()
  })

  it('hands the running page and its existing approval to an Explorer tab', async () => {
    const user = userEvent.setup()

    customRender(
      <GeneratedPageRenderer
        state="approval-requested"
        input={input}
        confirmState="approval-requested"
      />
    )

    await user.click(await screen.findByRole('button', { name: 'Run page' }))
    await waitFor(() => expect(getFrame()).not.toBeNull())
    await user.click(screen.getByRole('button', { name: 'Expand' }))

    const entries = Object.values(explorerGeneratedPageState.pages)
    expect(entries).toHaveLength(1)
    const entry = entries[0]
    expect(entry.projectRef).toBe(PROJECT_REF)
    expect(entry.page.title).toBe('Auth debugging console')
    // The approval carried over rather than being rebuilt: the fragments are already promoted.
    expect(entry.approvedQueries.database.get('recent_users')?.rowLimit).toBe(25)
    expect(entry.approvedQueries.logs.get('auth_errors')).toBeDefined()

    expect(mockRouterPush).toHaveBeenCalledWith(`/project/${PROJECT_REF}/explorer/page/${entry.id}`)
  })

  it('falls back to a review-only card when the input does not parse', async () => {
    customRender(
      <GeneratedPageRenderer
        state="approval-requested"
        input={{ title: 'Broken', html: 42 }}
        confirmState="approval-requested"
      />
    )

    expect(await screen.findByText("Couldn't render this page")).toBeInTheDocument()
    expect(getFrame()).toBeNull()
  })
})
