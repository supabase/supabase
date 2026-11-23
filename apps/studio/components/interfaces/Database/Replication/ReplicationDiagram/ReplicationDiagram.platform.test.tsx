import { createFileRoute } from '@tanstack/react-router'
import { screen, within } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'

import { ReplicationDiagram } from './index'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { createMockProject } from '@/tests/helpers'
import { addAPIMock } from '@/tests/lib/msw'
import { renderRoute } from '@/tests/lib/route-render'

test.each([
  { selected: false, count: 1, shared: false, mode: 'separate datasets' },
  { selected: false, count: 2, shared: true, mode: 'four named pipelines sharing a dataset' },
  { selected: false, count: 3, shared: true, mode: 'region counts sharing a dataset' },
  { selected: true, count: 3, shared: false, mode: 'one selected pipeline' },
])(
  'shows $mode across clusters while editing a nondefault cluster',
  async ({ count, shared, selected }) => {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<components['schemas']['ProjectDetailResponse_Output']>({
          ...createMockProject({ ref: 'default', region: 'us-east-1' }),
          inserted_at: '2026-01-01T00:00:00.000Z',
          subscription_id: 'subscription-1',
          status: 'ACTIVE_HEALTHY',
          is_physical_backups_enabled: false,
          connectionString: null,
          db_host: 'preview.invalid',
          high_availability: false,
          integration_source: null,
          restUrl: 'http://localhost',
          updated_at: '2026-01-01T00:00:00.000Z',
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/destinations',
      response: ({ request }) => {
        const clusterId = new URL(request.url).searchParams.get('cluster_id')
        return HttpResponse.json<components['schemas']['DestinationsResponse_Output']>({
          destinations: Array.from({ length: count }, (_, index) => ({
            id: 7 + index,
            tenant_id: 'default',
            name: clusterId ? 'Frankfurt warehouse' : 'Singapore warehouse',
            config: {
              big_query: {
                project_id: 'warehouse',
                dataset_id: shared ? 'shared_events' : clusterId ? 'eu_events' : 'asia_events',
              },
            },
          })),
        })
      },
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: ({ params }) =>
        HttpResponse.json<components['schemas']['PipelineStatusResponse_Output']>({
          pipeline_id: String(params.pipeline_id),
          status: { name: 'started' },
        }),
    })
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
      path: '/platform/replication/:ref/pipelines',
      response: ({ request }) => {
        const clusterId = new URL(request.url).searchParams.get('cluster_id')
        return HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({
          pipelines: Array.from({ length: count }, (_, index) => ({
            id: String(42 + index),
            cluster_id: clusterId ?? '1',
            tenant_id: 'default',
            source_id: 1,
            source_name: 'default',
            destination_id: 7 + index,
            destination_name: `${clusterId ? 'Frankfurt' : 'Singapore'} warehouse ${index + 1}`,
            replicator_id: 1,
            config: { publication_name: 'publication' },
          })),
        })
      },
    })

    const routeId = '/project/$ref/database/pipelines/'
    const route = createFileRoute(routeId)({
      component: () => (
        <ReplicationClusterProvider clusterId="2">
          <PipelineRequestStatusProvider>
            <ReplicationDiagram
              pipelineId={selected ? '42' : undefined}
              clusterId={selected ? '2' : undefined}
            />
          </PipelineRequestStatusProvider>
        </ReplicationClusterProvider>
      ),
    })
    await renderRoute(route, { routeId, url: '/project/default/database/pipelines' })

    const overview = await screen.findByRole('region', { name: 'Pipeline overview' })
    expect(within(overview).getByText('Primary database')).toBeVisible()
    expect(await within(overview).findByText('North Virginia')).toBeVisible()
    if (selected) {
      expect(await within(overview).findByText('Frankfurt warehouse 1')).toBeVisible()
      expect(within(overview).queryByText('Frankfurt warehouse 2')).not.toBeInTheDocument()
      expect(within(overview).queryByText('Singapore')).not.toBeInTheDocument()
      expect(within(overview).getAllByText('BigQuery')).toHaveLength(1)
      expect(within(overview).queryByRole('link', { name: /warehouse/ })).not.toBeInTheDocument()
      return
    }
    expect(within(overview).getByText('Pipelines', { exact: true })).toBeVisible()
    expect(await within(overview).findByText('Singapore')).toBeVisible()
    expect(await within(overview).findByText('Frankfurt')).toBeVisible()

    if (count > 2) {
      expect(screen.queryByRole('link', { name: /warehouse/ })).not.toBeInTheDocument()
      expect(screen.getAllByText('3 pipelines')).toHaveLength(2)
    } else {
      for (let index = 0; index < count; index++) {
        expect(
          await screen.findByRole('link', { name: `Singapore warehouse ${index + 1}` })
        ).toHaveAttribute('href', `/project/default/database/pipelines/${42 + index}`)
        expect(
          await screen.findByRole('link', { name: `Frankfurt warehouse ${index + 1}` })
        ).toHaveAttribute('href', `/project/default/database/pipelines/${42 + index}?cluster_id=2`)
      }
    }
    if (shared) {
      expect(await within(overview).findByText('warehouse.shared_events')).toBeVisible()
      expect(within(overview).getAllByText('BigQuery')).toHaveLength(1)
      expect(within(overview).queryByText('Location unavailable')).not.toBeInTheDocument()
    } else {
      expect(await within(overview).findByText('warehouse.asia_events')).toBeVisible()
      expect(await within(overview).findByText('warehouse.eu_events')).toBeVisible()
      expect(within(overview).getAllByText('BigQuery')).toHaveLength(2)
    }
  }
)
