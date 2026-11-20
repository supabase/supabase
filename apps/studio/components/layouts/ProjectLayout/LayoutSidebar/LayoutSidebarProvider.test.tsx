import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { HttpResponse } from 'msw'
import { parseAsString, useQueryState } from 'nuqs'
import type { UrlUpdateEvent } from 'nuqs/adapters/testing'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'

import { LayoutSidebarProvider, SIDEBAR_KEYS } from './LayoutSidebarProvider'
import { projectKeys } from '@/data/projects/keys'
import { sidebarManagerState } from '@/state/sidebar-manager-state'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']

const PROJECT_REF = 'default'

const PROJECT: ProjectDetailResponse = {
  cloud_provider: 'AWS',
  connectionString: `postgresql://postgres:password@db.${PROJECT_REF}.supabase.co:5432/postgres`,
  db_host: `db.${PROJECT_REF}.supabase.co`,
  high_availability: false,
  id: 1,
  infra_compute_size: 'micro',
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Production',
  organization_id: 1,
  ref: PROJECT_REF,
  region: 'us-east-1',
  restUrl: `https://${PROJECT_REF}.supabase.co`,
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const resetSidebarManagerState = () => {
  Object.keys(sidebarManagerState.sidebars).forEach((id) => {
    sidebarManagerState.unregisterSidebar(id)
  })
  sidebarManagerState.closeActive()
}

const SidebarParamProbe = () => {
  const [sidebar] = useQueryState('sidebar', parseAsString)
  return <div data-testid="sidebar-param">{sidebar ?? ''}</div>
}

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

const renderWithSidebarParam = (
  sidebarId: string,
  {
    project,
    projectResponse,
  }: {
    project?: ProjectDetailResponse
    projectResponse?: () => Promise<Response> | Response
  } = {}
) => {
  const urlUpdates: UrlUpdateEvent[] = []
  const queryClient = createQueryClient()
  if (project) {
    queryClient.setQueryData(projectKeys.detail(PROJECT_REF), project)
  }

  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: projectResponse ?? (() => HttpResponse.json<ProjectDetailResponse>(PROJECT)),
  })

  customRender(
    <LayoutSidebarProvider>
      <SidebarParamProbe />
    </LayoutSidebarProvider>,
    {
      queryClient,
      nuqs: {
        hasMemory: true,
        // the testing adapter otherwise resets the nuqs queue on every render, which drops the write under test.
        resetUrlUpdateQueueOnMount: false,
        searchParams: `?sidebar=${sidebarId}`,
        onUrlUpdate: (event) => {
          urlUpdates.push(event)
        },
      },
    }
  )

  return { queryClient, urlUpdates }
}

describe('LayoutSidebarProvider sidebar deep link', () => {
  let releaseProject = () => {}

  beforeEach(() => {
    resetSidebarManagerState()
    routerMock.setCurrentUrl(`/project/${PROJECT_REF}`)
    localStorage.clear()
    releaseProject = () => {}
  })

  afterEach(() => {
    releaseProject()
    localStorage.clear()
  })

  test.each([SIDEBAR_KEYS.ADVISOR_PANEL, SIDEBAR_KEYS.AI_ASSISTANT])(
    'does not clear ?sidebar=%s on initial mount, and clears it after the sidebar closes',
    async (sidebarId) => {
      const { urlUpdates } = renderWithSidebarParam(sidebarId, { project: PROJECT })

      await waitFor(() => {
        expect(sidebarManagerState.activeSidebar?.id).toBe(sidebarId)
      })

      // nuqs flushes on a later tick even when throttling is disabled
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })

      expect(screen.getByTestId('sidebar-param').textContent).toBe(sidebarId)
      expect(urlUpdates).toEqual([])

      act(() => {
        sidebarManagerState.closeActive()
      })

      await waitFor(() => {
        expect(urlUpdates).toEqual([
          expect.objectContaining({
            queryString: '',
            options: expect.objectContaining({ history: 'replace' }),
          }),
        ])
      })
      expect(screen.getByTestId('sidebar-param').textContent).toBe('')
      expect(urlUpdates[0]?.searchParams.has('sidebar')).toBe(false)
    }
  )

  test('does not clear ?sidebar= when the open sidebar unregisters', async () => {
    const { urlUpdates } = renderWithSidebarParam(SIDEBAR_KEYS.AI_ASSISTANT, { project: PROJECT })

    await waitFor(() => {
      expect(sidebarManagerState.activeSidebar?.id).toBe(SIDEBAR_KEYS.AI_ASSISTANT)
    })

    act(() => {
      sidebarManagerState.unregisterSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(sidebarManagerState.activeSidebar).toBeUndefined()
    expect(screen.getByTestId('sidebar-param').textContent).toBe(SIDEBAR_KEYS.AI_ASSISTANT)
    expect(urlUpdates).toEqual([])
  })

  test('clears ?sidebar= when the sidebar closes before the project loads', async () => {
    const projectReleased = new Promise<void>((resolve) => {
      releaseProject = resolve
    })

    const { queryClient, urlUpdates } = renderWithSidebarParam(SIDEBAR_KEYS.ADVISOR_PANEL, {
      projectResponse: async () => {
        await projectReleased
        return HttpResponse.json<ProjectDetailResponse>(PROJECT)
      },
    })

    await waitFor(() => {
      expect(sidebarManagerState.activeSidebar?.id).toBe(SIDEBAR_KEYS.ADVISOR_PANEL)
    })
    expect(queryClient.getQueryData(projectKeys.detail(PROJECT_REF))).toBeUndefined()

    act(() => {
      sidebarManagerState.closeActive()
    })

    await waitFor(() => {
      expect(urlUpdates).toEqual([
        expect.objectContaining({
          queryString: '',
          options: expect.objectContaining({ history: 'replace' }),
        }),
      ])
    })
    expect(screen.getByTestId('sidebar-param').textContent).toBe('')
  })

  // guards opened-sidebar tracking being recorded above the !project guard. a later close still has to clear ?sidebar=.
  test('clears ?sidebar= on close when the panel opened before the project loaded', async () => {
    const projectReleased = new Promise<void>((resolve) => {
      releaseProject = resolve
    })

    const { queryClient, urlUpdates } = renderWithSidebarParam(SIDEBAR_KEYS.ADVISOR_PANEL, {
      projectResponse: async () => {
        await projectReleased
        return HttpResponse.json<ProjectDetailResponse>(PROJECT)
      },
    })

    await waitFor(() => {
      expect(sidebarManagerState.activeSidebar?.id).toBe(SIDEBAR_KEYS.ADVISOR_PANEL)
    })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(urlUpdates).toEqual([])

    releaseProject()
    await waitFor(() => {
      expect(queryClient.getQueryData(projectKeys.detail(PROJECT_REF))).toBeTruthy()
    })

    act(() => {
      sidebarManagerState.closeActive()
    })

    await waitFor(() => {
      expect(urlUpdates).toEqual([
        expect.objectContaining({
          queryString: '',
          options: expect.objectContaining({ history: 'replace' }),
        }),
      ])
    })
  })
})
