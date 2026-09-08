import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { ReadReplicasSection } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicasSection'
import type { components } from '@/data/api'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type DatabaseDetailResponse = components['schemas']['DatabaseDetailResponse']
type DatabaseStatusResponse = components['schemas']['DatabaseStatusResponse']
type LoadBalancerDetailResponse = components['schemas']['LoadBalancerDetailResponse']

const { mockUseIsFeatureEnabled } = vi.hoisted(() => ({
  mockUseIsFeatureEnabled: vi.fn(() => ({ infrastructureReadReplicas: true })),
}))

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: mockUseIsFeatureEnabled,
}))
vi.mock(
  '@/components/interfaces/Settings/Infrastructure/ReadReplicas/AddReadReplicaDialog',
  () => ({ AddReadReplicaDialog: () => null })
)

const addReplicaListMocks = () => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/databases',
    response: () =>
      HttpResponse.json<DatabaseDetailResponse[]>([
        {
          cloud_provider: 'AWS',
          connectionString: 'postgresql://postgres:password@db.default.supabase.co:5432/postgres',
          db_host: 'db.default.supabase.co',
          db_name: 'postgres',
          db_port: 5432,
          db_user: 'postgres',
          identifier: 'default',
          inserted_at: '2026-01-01T00:00:00.000Z',
          region: 'us-east-1',
          restUrl: 'https://default.supabase.co',
          size: 't4g.small',
          status: 'ACTIVE_HEALTHY',
        },
      ]),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/databases-statuses',
    response: () => HttpResponse.json<DatabaseStatusResponse[]>([]),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/load-balancers',
    response: () => HttpResponse.json<LoadBalancerDetailResponse[]>([]),
  })
}

describe('ReadReplicasSection', () => {
  beforeEach(() => {
    mockUseIsFeatureEnabled.mockReturnValue({ infrastructureReadReplicas: true })
  })

  test('renders the read replicas section with add CTA and empty state', async () => {
    mockUseIsFeatureEnabled.mockReturnValue({ infrastructureReadReplicas: true })
    addReplicaListMocks()

    customRender(<ReadReplicasSection onRecommendCompute={vi.fn()} />)

    expect(await screen.findByText('Read replicas')).toBeInTheDocument()
    expect(await screen.findByText('No read replicas')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Add read replica/i }).length).toBeGreaterThan(0)
  })

  test('does not fetch replicas when the feature is disabled', async () => {
    mockUseIsFeatureEnabled.mockReturnValue({ infrastructureReadReplicas: false })

    let fetchedReplicas = false
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/databases',
      response: () => {
        fetchedReplicas = true
        return HttpResponse.json<DatabaseDetailResponse[]>([])
      },
    })

    customRender(<ReadReplicasSection onRecommendCompute={vi.fn()} />)

    expect(screen.queryByText('Read replicas')).not.toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchedReplicas).toBe(false)
  })
})
