import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { TooltipProvider } from 'ui'
import { CommandProvider } from 'ui-patterns/CommandMenu'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { RolesList } from './RolesList'
import type { PgRole } from '@/data/database-roles/database-roles-query'
import { resetPanelHistoryForTests } from '@/lib/panel-history'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import {
  installNavigationDouble,
  uninstallNavigationDouble,
} from '@/tests/lib/panel-navigation-double'

const { toastMock } = vi.hoisted(() => ({
  toastMock: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

vi.mock('sonner', () => ({
  toast: toastMock,
}))

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']

mockAnimationsApi()

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

function mockRolesApis() {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: project,
  })
  addAPIMock({
    method: 'post',
    path: '/platform/pg-meta/:ref/query',
    response: async ({ request }) => {
      const key = new URL(request.url).searchParams.get('key')

      if (key === 'max-connections') {
        return HttpResponse.json<[{ max_connections: number }]>([{ max_connections: 60 }])
      }

      return HttpResponse.json<[]>([])
    },
  })
}

const customRole: PgRole = {
  id: 4,
  name: 'custom_role',
  isSuperuser: false,
  canCreateDb: false,
  canCreateRole: false,
  inheritRole: true,
  canLogin: true,
  isReplicationRole: false,
  canBypassRls: false,
  activeConnections: 0,
  connectionLimit: -1,
  validUntil: null,
  config: {},
}

describe('RolesList URL history', () => {
  beforeEach(() => {
    mockRolesApis()
  })

  afterEach(() => {
    resetPanelHistoryForTests()
    uninstallNavigationDouble()
  })

  it('pushes history when the create panel opens', async () => {
    const onUrlUpdate = vi.fn()
    customRender(<RolesList />, {
      nuqs: { hasMemory: true, rateLimitFactor: 1, onUrlUpdate },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Add role' }))

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const [update] = onUrlUpdate.mock.calls.at(-1)!
    expect(update.queryString).toContain('new=true')
    expect(update.options.history).toBe('push')
  })

  it('replaces history when a missing role id is cleared', async () => {
    const onUrlUpdate = vi.fn()
    customRender(<RolesList />, {
      nuqs: {
        hasMemory: true,
        rateLimitFactor: 1,
        onUrlUpdate,
        searchParams: '?delete=999',
      },
    })

    await waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    const [update] = onUrlUpdate.mock.calls.at(-1)!
    expect(update.queryString).not.toContain('delete=')
    expect(update.options.history).toBe('replace')
  })

  it('clears a deleted role id when forward restores it', async () => {
    let deleted = false

    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: ({ request }) => {
        const key = new URL(request.url).searchParams.get('key')

        if (key === 'max-connections') {
          return HttpResponse.json([{ max_connections: 60 }])
        }

        if (key === 'database-roles') {
          return HttpResponse.json(deleted ? [] : [customRole])
        }

        deleted = true
        return HttpResponse.json([])
      },
    })

    window.history.replaceState(null, '', '/project/default/database/roles')
    installNavigationDouble()

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <TooltipProvider>
            <CommandProvider openKey="">
              <RolesList />
            </CommandProvider>
          </TooltipProvider>
        </NuqsAdapter>
      </QueryClientProvider>
    )

    await userEvent.click(await screen.findByRole('button', { name: 'custom_role actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    expect(await screen.findByRole('dialog')).toHaveTextContent(
      'Confirm to delete role "custom_role"'
    )
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(window.location.search).not.toContain('delete='))

    const restoredSearches: string[] = []
    const onPopState = () => {
      restoredSearches.push(window.location.search)
    }
    window.addEventListener('popstate', onPopState)

    window.history.forward()

    await waitFor(() =>
      expect(restoredSearches.some((search) => search.includes('delete=4'))).toBe(true)
    )
    await waitFor(() => expect(window.location.search).not.toContain('delete='))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    window.removeEventListener('popstate', onPopState)
  })

  it('clears a different missing role id after a successful delete', async () => {
    let deleted = false

    addAPIMock({
      method: 'post',
      path: '/platform/pg-meta/:ref/query',
      response: ({ request }) => {
        const key = new URL(request.url).searchParams.get('key')

        if (key === 'max-connections') {
          return HttpResponse.json([{ max_connections: 60 }])
        }

        if (key === 'database-roles') {
          return HttpResponse.json(deleted ? [] : [customRole])
        }

        deleted = true
        return HttpResponse.json([])
      },
    })

    window.history.replaceState(null, '', '/project/default/database/roles')
    installNavigationDouble()

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <NuqsAdapter>
          <TooltipProvider>
            <CommandProvider openKey="">
              <RolesList />
            </CommandProvider>
          </TooltipProvider>
        </NuqsAdapter>
      </QueryClientProvider>
    )

    await userEvent.click(await screen.findByRole('button', { name: 'custom_role actions' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Submit' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(window.location.search).not.toContain('delete='))

    toastMock.mockClear()
    await act(async () => {
      window.history.pushState(null, '', '/project/default/database/roles?delete=999')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })

    await waitFor(() => expect(window.location.search).not.toContain('delete='))
    expect(toastMock).toHaveBeenCalledWith('Role cannot be found')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
