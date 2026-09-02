import { screen, within } from '@testing-library/react'
import { ReactFlowProvider } from '@xyflow/react'
import { platformComponents as components } from 'api-types'
import { http, HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { HaInstanceConfiguration } from './HaInstanceConfiguration'
import { API_URL } from '@/lib/constants'
import type { ProfileContextType } from '@/lib/profile'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer, type APIErrorBody } from '@/tests/lib/msw'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse']

vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/constants')>()
  return {
    ...actual,
    IS_PLATFORM: true,
  }
})

const PROFILE_CONTEXT: ProfileContextType = {
  profile: {
    id: 1,
    auth0_id: 'auth0|test',
    gotrue_id: 'gotrue-test',
    username: 'testuser',
    primary_email: 'test@example.com',
    first_name: null,
    last_name: null,
    mobile: null,
    is_alpha_user: false,
    is_sso_user: false,
    disabled_features: [],
    free_project_limit: null,
  },
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
}

const PROJECT: ProjectDetailResponse = {
  cloud_provider: 'AWS_K8S',
  connectionString: 'postgresql://postgres:password@db.default.supabase.co:5432/postgres',
  db_host: 'db.default.supabase.co',
  dbVersion: 'supabase-postgres-15.1.0',
  high_availability: true,
  id: 1,
  infra_compute_size: 'large',
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Production',
  organization_id: 1,
  ref: 'default',
  region: 'us-east-1',
  restUrl: 'https://default.supabase.co',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const mockProject = (status: ProjectDetailResponse['status']) => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: { ...PROJECT, status } satisfies ProjectDetailResponse,
  })
}

// The /ha-admin passthrough paths are off-schema (see get-ha-admin.ts), so they
// can't go through the OpenAPI-typed addAPIMock.
const mockHaAdmin = ({ isHealthy }: { isHealthy: boolean }) => {
  mswServer.use(
    http.get(`${API_URL}/platform/projects/:ref/ha-admin/v1/gateways`, () =>
      isHealthy
        ? HttpResponse.json({ gateways: [] })
        : HttpResponse.json<APIErrorBody>({ message: 'upstream unavailable' }, { status: 500 })
    ),
    http.get(`${API_URL}/platform/projects/:ref/ha-admin/v1/poolers`, () =>
      isHealthy
        ? HttpResponse.json({ poolers: [] })
        : HttpResponse.json<APIErrorBody>({ message: 'upstream unavailable' }, { status: 500 })
    )
  )
}

describe('HaInstanceConfiguration', () => {
  test('shows the setup state instead of an error while the project is coming up', async () => {
    mockProject('COMING_UP')
    mockHaAdmin({ isHealthy: false })

    customRender(<HaInstanceConfiguration />, { profileContext: PROFILE_CONTEXT })

    const statusRegion = await screen.findByRole('status')
    expect(await within(statusRegion).findByText('Setting up project')).toBeInTheDocument()
    expect(screen.queryByText('Failed to retrieve cluster topology')).not.toBeInTheDocument()
  })

  test('shows the setup state instead of the unavailable state while the project is coming up with an empty topology', async () => {
    mockProject('COMING_UP')
    mockHaAdmin({ isHealthy: true })

    customRender(<HaInstanceConfiguration />, { profileContext: PROFILE_CONTEXT })

    expect(await screen.findByText('Setting up project')).toBeInTheDocument()
    expect(screen.queryByText('Cluster topology unavailable')).not.toBeInTheDocument()
  })

  test('surfaces topology errors once the project is running', async () => {
    mockProject('ACTIVE_HEALTHY')
    mockHaAdmin({ isHealthy: false })

    customRender(<HaInstanceConfiguration />, { profileContext: PROFILE_CONTEXT })

    expect(await screen.findByText('Failed to retrieve cluster topology')).toBeInTheDocument()
  })

  test('shows the unavailable state for an empty topology once the project is running', async () => {
    mockProject('ACTIVE_HEALTHY')
    mockHaAdmin({ isHealthy: true })

    customRender(<HaInstanceConfiguration />, { profileContext: PROFILE_CONTEXT })

    expect(await screen.findByText('Cluster topology unavailable')).toBeInTheDocument()
  })

  test('uses mock topology data without calling HA admin when simulating High Availability', async () => {
    mockProject('ACTIVE_HEALTHY')
    let haAdminRequests = 0
    mswServer.use(
      http.get(`${API_URL}/platform/projects/:ref/ha-admin/v1/gateways`, () => {
        haAdminRequests += 1
        return HttpResponse.json<APIErrorBody>({ message: 'upstream unavailable' }, { status: 500 })
      }),
      http.get(`${API_URL}/platform/projects/:ref/ha-admin/v1/poolers`, () => {
        haAdminRequests += 1
        return HttpResponse.json<APIErrorBody>({ message: 'upstream unavailable' }, { status: 500 })
      })
    )

    customRender(
      <ReactFlowProvider>
        <HaInstanceConfiguration simulateHighAvailability />
      </ReactFlowProvider>,
      { profileContext: PROFILE_CONTEXT }
    )

    expect(await screen.findByText('Primary Database')).toBeInTheDocument()
    expect(screen.getAllByText('Read Replica')).toHaveLength(2)
    expect(screen.queryByText('Failed to retrieve cluster topology')).not.toBeInTheDocument()
    expect(haAdminRequests).toBe(0)
  })

  test('shows the primary as unhealthy and a replica as promoting during the promoting step', async () => {
    mockProject('ACTIVE_HEALTHY')

    customRender(
      <ReactFlowProvider>
        <HaInstanceConfiguration simulateHighAvailability failoverPhase="promoting" />
      </ReactFlowProvider>,
      { profileContext: PROFILE_CONTEXT }
    )

    expect(await screen.findByText('Primary Database')).toBeInTheDocument()
    expect(screen.getByText('Promoting')).toBeInTheDocument()
    expect(screen.queryByText('Promoted')).not.toBeInTheDocument()
    expect(
      within(screen.getByText('Primary Database').parentElement!).getByText('Unhealthy')
    ).toBeInTheDocument()
  })

  test('shows the primary as unhealthy and a replica as promoted and healthy during simulated failover', async () => {
    mockProject('ACTIVE_HEALTHY')

    customRender(
      <ReactFlowProvider>
        <HaInstanceConfiguration simulateHighAvailability failoverPhase="failover" />
      </ReactFlowProvider>,
      { profileContext: PROFILE_CONTEXT }
    )

    expect(await screen.findByText('Primary Database')).toBeInTheDocument()
    expect(screen.getAllByText('Read Replica')).toHaveLength(2)
    expect(screen.getAllByText('Healthy')).toHaveLength(2)
    expect(screen.getByText('Unhealthy')).toBeInTheDocument()
    expect(
      within(screen.getByText('Primary Database').parentElement!).getByText('Unhealthy')
    ).toBeInTheDocument()
    expect(
      within(screen.getByText('Promoted').parentElement!).getByText('Healthy')
    ).toBeInTheDocument()
  })
})
