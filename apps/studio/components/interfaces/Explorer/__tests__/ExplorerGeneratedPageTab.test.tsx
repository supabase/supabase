import { acceptUntrustedSql, untrustedSql } from '@supabase/pg-meta'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ExplorerGeneratedPageTab } from '../ExplorerGeneratedPageTab'
import type { ApprovedGeneratedPageQueries } from '../GeneratedPage/generated-page.utils'
import type { RenderPageInput } from '@/lib/ai/tools/generated-page-schema'
import {
  addExplorerGeneratedPage,
  explorerGeneratedPageState,
  removeExplorerGeneratedPage,
} from '@/state/explorer-generated-page'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const PAGE_ID = 'page-1'
const PROJECT_REF = 'default'

// The global setup mocks `useParams` to `{ ref: 'default' }` only; this tab also reads the
// route's `id`, so both are supplied here.
vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return { ...actual, useParams: () => ({ ref: PROJECT_REF, id: PAGE_ID }) }
})

const page: RenderPageInput = {
  title: 'Auth debugging console',
  html: '<h1 id="page-heading">Auth console</h1>',
  database_queries: [
    { id: 'recent_users', title: 'Recent users', sql: 'select id from auth.users', row_limit: 25 },
  ],
  log_queries: [],
  enable_supabase_client: false,
}

const approvedQueries: ApprovedGeneratedPageQueries = {
  database: new Map([
    [
      'recent_users',
      {
        title: 'Recent users',
        sql: acceptUntrustedSql(untrustedSql('select id from auth.users')),
        rowLimit: 25,
      },
    ],
  ]),
  logs: new Map(),
}

const getFrame = () => document.querySelector('[data-testid="generated-page-frame"]')

beforeEach(() => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: { ref: 'default', name: 'Default', connectionString: 'postgres://x' } as never,
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/settings',
    response: { app_config: { protocol: 'https', endpoint: 'default.supabase.co' } } as never,
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
    ] as never,
  })
})

afterEach(() => {
  for (const id of Object.keys(explorerGeneratedPageState.pages)) removeExplorerGeneratedPage(id)
})

describe('ExplorerGeneratedPageTab', () => {
  it('runs a handed-over page immediately, without asking for approval again', async () => {
    addExplorerGeneratedPage({ id: PAGE_ID, projectRef: PROJECT_REF, page, approvedQueries })

    customRender(<ExplorerGeneratedPageTab />)

    expect(await screen.findByText('Auth debugging console')).toBeInTheDocument()
    await waitFor(() => expect(getFrame()).not.toBeNull())

    const frame = getFrame() as HTMLIFrameElement
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts')
    expect(frame.srcdoc).toContain('<h1 id="page-heading">Auth console</h1>')
    expect(screen.queryByRole('button', { name: 'Run page' })).not.toBeInTheDocument()
  })

  it('says the page is gone when nothing was handed over, e.g. after a reload', async () => {
    customRender(<ExplorerGeneratedPageTab />)

    expect(await screen.findByText('This page is no longer available')).toBeInTheDocument()
    expect(getFrame()).toBeNull()
  })

  it('does not run a page that belongs to another project', async () => {
    addExplorerGeneratedPage({ id: PAGE_ID, projectRef: 'other-project', page, approvedQueries })

    customRender(<ExplorerGeneratedPageTab />)

    expect(await screen.findByText('This page is no longer available')).toBeInTheDocument()
    expect(getFrame()).toBeNull()
  })

  it('destroys the frame on stop and can start it again', async () => {
    addExplorerGeneratedPage({ id: PAGE_ID, projectRef: PROJECT_REF, page, approvedQueries })
    const user = userEvent.setup()

    customRender(<ExplorerGeneratedPageTab />)
    await waitFor(() => expect(getFrame()).not.toBeNull())

    await user.click(screen.getByRole('button', { name: 'Stop page' }))
    expect(getFrame()).toBeNull()
    expect(screen.getByText('This page is stopped.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Run page' }))
    await waitFor(() => expect(getFrame()).not.toBeNull())
  })
})
