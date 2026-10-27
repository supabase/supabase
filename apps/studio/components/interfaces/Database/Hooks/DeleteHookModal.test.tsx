import type { PGTrigger } from '@supabase/pg-meta'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { TooltipProvider } from 'ui'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DeleteHookModal } from './DeleteHookModal'
import { HookList } from './HooksList/HookList'
import { resetPanelHistoryForTests } from '@/lib/panel-history'
import { addAPIMock } from '@/tests/lib/msw'
import {
  installNavigationDouble,
  uninstallNavigationDouble,
} from '@/tests/lib/panel-navigation-double'

vi.mock('next/legacy/image', () => ({
  default: () => null,
}))

const { toastMock } = vi.hoisted(() => ({
  toastMock: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('sonner', () => ({
  toast: toastMock,
}))

mockAnimationsApi()

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']

const project: ProjectDetailResponse = {
  id: 1,
  ref: 'default',
  name: 'Default Project',
  organization_id: 1,
  status: 'ACTIVE_HEALTHY',
  cloud_provider: 'localhost',
  region: 'local',
  db_host: 'localhost',
  restUrl: 'http://localhost:8000/rest/v1/',
  connectionString: null,
  inserted_at: '2021-08-02T06:40:40.646Z',
  updated_at: '2021-08-02T06:40:40.646Z',
  subscription_id: 'subscription',
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  high_availability: false,
  integration_source: null,
}

const ordersHook: PGTrigger = {
  id: 7,
  table_id: 1,
  enabled_mode: 'ORIGIN',
  function_args: ['https://example.com/hook', 'POST'],
  name: 'orders_hook',
  table: 'orders',
  schema: 'public',
  condition: null,
  orientation: 'ROW',
  activation: 'AFTER',
  events: ['INSERT'],
  function_name: 'http_request',
  function_schema: 'supabase_functions',
}

function mockHookDeleteFlow() {
  let deleted = false

  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: project,
  })
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: ({ request }) => {
      const key = new URL(request.url).searchParams.get('key')

      if (key === 'triggers') {
        return HttpResponse.json<PGTrigger[]>(deleted ? [] : [ordersHook])
      }

      if (key === 'trigger-delete-7') deleted = true
      return HttpResponse.json<[]>([])
    },
  })
}

describe('DeleteHookModal', () => {
  afterEach(() => {
    resetPanelHistoryForTests()
    uninstallNavigationDouble()
    toastMock.mockClear()
  })

  it('clears a deleted webhook id when forward restores it', async () => {
    mockHookDeleteFlow()
    window.history.replaceState(null, '', '/project/default/integrations/webhooks')
    installNavigationDouble()

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    // customRender mounts the nuqs testing adapter, which never calls history.forward or listens for popstate.
    render(
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <TooltipProvider>
            <table>
              <tbody>
                <HookList schema="public" filterString="" />
              </tbody>
            </table>
            <DeleteHookModal />
          </TooltipProvider>
        </NuqsAdapter>
      </QueryClientProvider>
    )

    await userEvent.click(await screen.findByRole('button', { name: 'orders_hook actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete hook' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(screen.getByPlaceholderText('Type in name of webhook'), 'orders_hook')
    // userEvent.click dispatches a click that jsdom does not treat as a submit activation.
    fireEvent.click(screen.getByRole('button', { name: 'Delete orders_hook' }))

    await waitFor(() => expect(dialog).not.toBeInTheDocument())
    await waitFor(() => expect(window.location.search).not.toContain('delete='))

    const restoredSearches: string[] = []
    const onPopState = () => {
      restoredSearches.push(window.location.search)
    }
    window.addEventListener('popstate', onPopState)
    window.history.forward()

    await waitFor(() =>
      expect(restoredSearches.some((search) => search.includes('delete=7'))).toBe(true)
    )
    await waitFor(() => expect(window.location.search).not.toContain('delete='))
    expect(toastMock).not.toHaveBeenCalledWith('Webhook not found')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    window.removeEventListener('popstate', onPopState)
  })
})
