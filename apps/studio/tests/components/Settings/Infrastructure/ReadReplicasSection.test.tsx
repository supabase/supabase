import { screen } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { ReadReplicasSection } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicasSection'
import type { components } from '@/data/api'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type DatabaseDetailResponse = components['schemas']['DatabaseDetailResponse']
type DatabaseStatusResponse = components['schemas']['DatabaseStatusResponse']
type LoadBalancerDetailResponse = components['schemas']['LoadBalancerDetailResponse']

vi.mock('@/hooks/misc/useIsFeatureEnabled', () => ({
  useIsFeatureEnabled: () => ({ infrastructureReadReplicas: true }),
}))

describe('ReadReplicasSection', () => {
  test('renders the read replicas section with add CTA and empty state', async () => {
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

    customRender(<ReadReplicasSection />)

    expect(await screen.findByText('Read replicas')).toBeInTheDocument()
    expect(await screen.findByText('No read replicas')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Add read replica/i }).length).toBeGreaterThan(0)
  })
})
