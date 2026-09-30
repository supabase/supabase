import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { StatusBanner } from './StatusBanner'
import { platformKeys } from '@/data/platform/keys'
import { BASE_PATH } from '@/lib/constants'
import type { StatusPageResponse } from '@/lib/status-page/status-page.schema'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

type OrganizationResponse = components['schemas']['OrganizationResponse_Output']
type OrganizationProjectsResponse = components['schemas']['OrganizationProjectsResponse_Output']
type OrgProject = OrganizationProjectsResponse['projects'][number]
type OrgDatabase = OrgProject['databases'][number]

function mockProject(
  ref: string,
  databases: Array<{ region: string; type: 'PRIMARY' | 'READ_REPLICA' }>
): OrgProject {
  return {
    cloud_provider: 'AWS',
    databases: databases.map(
      ({ region, type }): OrgDatabase => ({
        cloud_provider: 'AWS',
        identifier: ref,
        region,
        status: 'ACTIVE_HEALTHY',
        type,
      })
    ),
    inserted_at: new Date().toISOString(),
    integration_source: null,
    is_branch: false,
    name: ref,
    ref,
    region: databases[0]?.region ?? 'us-east-1',
    status: 'ACTIVE_HEALTHY',
  }
}

function buildStatusPage(overrides: Partial<StatusPageResponse> = {}): StatusPageResponse {
  return {
    page_title: 'Supabase status',
    page_url: 'https://status.supabase.com/',
    ongoing_incidents: [],
    in_progress_maintenances: [],
    scheduled_maintenances: [],
    ...overrides,
  }
}

function buildIncident(
  overrides: Partial<StatusPageResponse['ongoing_incidents'][number]> = {}
): StatusPageResponse['ongoing_incidents'][number] {
  return {
    id: 'inc-1',
    name: 'Elevated errors',
    url: 'https://status.supabase.com/incidents/inc-1',
    last_update_at: '2026-01-01T00:00:00Z',
    last_update_message: null,
    affected_components: [],
    status: 'investigating',
    current_worst_impact: 'full_outage',
    visible: true,
    show_banner: true,
    ...overrides,
  }
}

const INCIDENT_TITLE = 'We are investigating a technical issue'

const mockOrgProjectEndpoints = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: () =>
      HttpResponse.json<OrganizationResponse[]>([
        createMockOrganizationResponse({ slug: 'org-a' }),
      ]),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/projects',
    response: () =>
      HttpResponse.json<OrganizationProjectsResponse>({
        pagination: { count: 1, limit: 100, offset: 0 },
        projects: [mockProject('project-a', [{ region: 'us-east-1', type: 'PRIMARY' }])],
      }),
  })
}

const { mockUseFlag } = vi.hoisted(() => ({
  mockUseFlag: vi.fn().mockReturnValue(false),
}))

vi.mock(import('common'), async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, useFlag: mockUseFlag }
})

vi.mock(import('@/lib/constants'), async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, IS_PLATFORM: true }
})

describe('StatusBanner', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  test('renders nothing while orgs are loading', async () => {
    mswServer.use(
      http.get(`${BASE_PATH}/api/status-page`, () =>
        HttpResponse.json<StatusPageResponse>(
          buildStatusPage({ ongoing_incidents: [buildIncident()] })
        )
      )
    )
    const { promise: orgsRequested, resolve: releaseOrgsResponse } = Promise.withResolvers<void>()
    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: async () => {
        await orgsRequested
        return HttpResponse.json<OrganizationResponse[]>([
          createMockOrganizationResponse({ slug: 'org-a' }),
        ])
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/organizations/:slug/projects',
      response: () =>
        HttpResponse.json<OrganizationProjectsResponse>({
          pagination: { count: 1, limit: 100, offset: 0 },
          projects: [mockProject('project-a', [{ region: 'us-east-1', type: 'PRIMARY' }])],
        }),
    })

    customRender(<StatusBanner />, { profileContext: createMockProfileContext() })

    expect(screen.queryByText(INCIDENT_TITLE)).not.toBeInTheDocument()

    releaseOrgsResponse()

    await waitFor(() => {
      expect(screen.getByText(INCIDENT_TITLE)).toBeInTheDocument()
    })
  })

  test('dismissing hides the banner and writes the dismissed key to local storage', async () => {
    mswServer.use(
      http.get(`${BASE_PATH}/api/status-page`, () =>
        HttpResponse.json<StatusPageResponse>(
          buildStatusPage({ ongoing_incidents: [buildIncident({ id: 'inc-1' })] })
        )
      )
    )
    mockOrgProjectEndpoints()

    customRender(<StatusBanner />, { profileContext: createMockProfileContext() })

    await screen.findByText(INCIDENT_TITLE)

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss banner' }))

    await waitFor(() => {
      expect(screen.queryByText(INCIDENT_TITLE)).not.toBeInTheDocument()
    })

    expect(JSON.parse(window.localStorage.getItem('status-banner-dismissed-keys') ?? '[]')).toEqual(
      ['incident:inc-1']
    )
  })

  test('a new incident brings the banner back even though the previous one is dismissed', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

    mswServer.use(
      http.get(`${BASE_PATH}/api/status-page`, () =>
        HttpResponse.json<StatusPageResponse>(
          buildStatusPage({ ongoing_incidents: [buildIncident({ id: 'inc-1' })] })
        )
      )
    )
    mockOrgProjectEndpoints()

    customRender(<StatusBanner />, { profileContext: createMockProfileContext(), queryClient })

    await screen.findByText(INCIDENT_TITLE)

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss banner' }))

    await waitFor(() => {
      expect(screen.queryByText(INCIDENT_TITLE)).not.toBeInTheDocument()
    })

    mswServer.use(
      http.get(`${BASE_PATH}/api/status-page`, () =>
        HttpResponse.json<StatusPageResponse>(
          buildStatusPage({
            ongoing_incidents: [buildIncident({ id: 'inc-2', name: 'A different incident' })],
          })
        )
      )
    )

    await queryClient.invalidateQueries({ queryKey: platformKeys.statusPage() })

    await waitFor(() => {
      expect(screen.getByText(INCIDENT_TITLE)).toBeInTheDocument()
    })
  })

  test('the emergency override renders without fetching anything', async () => {
    mockUseFlag.mockImplementation((name: string) => name === 'ongoingIncident')

    customRender(<StatusBanner />, { profileContext: createMockProfileContext() })

    expect(await screen.findByText(INCIDENT_TITLE)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Dismiss banner' })).not.toBeInTheDocument()
  })
})
