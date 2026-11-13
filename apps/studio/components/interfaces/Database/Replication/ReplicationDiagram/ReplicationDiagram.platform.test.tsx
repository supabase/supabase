import { ReplicationDiagram } from '.'
import { screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'

import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

test('keeps default-cluster diagram nodes separate while editing a nondefault cluster', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/regions',
    response: () =>
      HttpResponse.json<components['schemas']['PipelineRegionsResponse_Output']>({
        default_cluster_id: '1',
        regions: [
          { cluster_id: '1', region_code: 'ap-southeast-1', region_name: 'Singapore' },
          { cluster_id: '2', region_code: 'eu-central-1', region_name: 'Frankfurt' },
        ],
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () =>
      HttpResponse.json<components['schemas']['ProjectDetailResponse_Output']>({
        cloud_provider: 'AWS',
        connectionString: null,
        db_host: 'db.default.supabase.co',
        high_availability: false,
        id: 1,
        inserted_at: '2026-01-01T00:00:00.000Z',
        integration_source: null,
        is_branch_enabled: false,
        is_physical_backups_enabled: false,
        name: 'Project',
        organization_id: 1,
        ref: 'default',
        region: 'ap-southeast-1',
        restUrl: 'https://default.supabase.co',
        status: 'ACTIVE_HEALTHY',
        subscription_id: 'subscription-1',
        updated_at: '2026-01-01T00:00:00.000Z',
      }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations',
    response: ({ request }) => {
      const name = new URL(request.url).searchParams.has('cluster_id')
        ? 'Frankfurt warehouse'
        : 'Singapore warehouse'
      return HttpResponse.json<components['schemas']['DestinationsResponse_Output']>({
        destinations: [
          {
            id: 7,
            name,
            tenant_id: 'default',
            config: {
              big_query: {
                connection_pool_size: 8,
                dataset_id: 'analytics',
                project_id: 'example-project',
              },
            },
          },
        ],
      })
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: () =>
      HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({ pipelines: [] }),
  })

  customRender(
    <ReplicationClusterProvider clusterId="2">
      <PipelineRequestStatusProvider>
        <ReplicationDiagram />
      </PipelineRequestStatusProvider>
    </ReplicationClusterProvider>
  )

  expect(await screen.findByText('Singapore warehouse')).toBeInTheDocument()
  expect(await screen.findByText('Frankfurt warehouse')).toBeInTheDocument()
})
