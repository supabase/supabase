import { QueryClient } from '@tanstack/react-query'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'

import { DestinationPanel } from './DestinationPanel'
import { organizationKeys } from '@/data/organizations/keys'
import type { OrganizationsData } from '@/data/organizations/organizations-query'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()

const SINGAPORE = { cluster_id: '1', region_code: 'ap-southeast-1', region_name: 'Singapore' }
const FRANKFURT = { cluster_id: '2', region_code: 'eu-central-1', region_name: 'Frankfurt' }
const clusterFrom = (request: Request) => new URL(request.url).searchParams.get('cluster_id')

const mockRegions = (regions = [SINGAPORE, FRANKFURT]) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/regions',
    response: () =>
      HttpResponse.json<components['schemas']['PipelineRegionsResponse_Output']>({
        default_cluster_id: SINGAPORE.cluster_id,
        regions,
      }),
  })

const mockProject = (region?: string) =>
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref',
    response: () =>
      region === undefined
        ? HttpResponse.json<APIErrorBody>(
            { message: 'Project details unavailable' },
            { status: 500 }
          )
        : HttpResponse.json<components['schemas']['ProjectDetailResponse_Output']>({
            cloud_provider: 'AWS',
            id: 1,
            inserted_at: '2026-01-01T00:00:00.000Z',
            is_branch_enabled: false,
            is_physical_backups_enabled: false,
            name: 'Project',
            organization_id: 1,
            ref: 'default',
            region,
            status: 'ACTIVE_HEALTHY',
            subscription_id: 'subscription-1',
            connectionString: null,
            db_host: 'db.default.supabase.co',
            high_availability: false,
            integration_source: null,
            restUrl: 'https://default.supabase.co',
            updated_at: '2026-01-01T00:00:00.000Z',
          }),
  })

const mockPanelResources = (
  enabledClusters: Set<string | null>,
  unavailableClusters = new Set<string | null>()
) => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations',
    response: { destinations: [] },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: { pipelines: [] },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources',
    response: ({ request }) => {
      const cluster = clusterFrom(request)
      if (unavailableClusters.has(cluster)) {
        return HttpResponse.json<APIErrorBody>(
          { message: 'Replication feature flag is required' },
          { status: 503 }
        )
      }
      return HttpResponse.json<components['schemas']['SourcesResponse_Output']>({
        sources: enabledClusters.has(cluster)
          ? [
              {
                id: 1,
                name: 'default',
                tenant_id: 'default',
                config: { host: 'localhost', port: 5432, name: 'postgres', username: 'postgres' },
              },
            ]
          : [],
      })
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications',
    response: ({ request }) =>
      HttpResponse.json<components['schemas']['ReadPublicationsResponse_Output']>({
        publications: [{ name: clusterFrom(request) === null ? 'singapore' : 'frankfurt' }],
      }),
  })
}

const renderPanel = (clusterId?: string) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData<OrganizationsData>(organizationKeys.list(), [])
  customRender(
    <FeatureFlagContext.Provider
      value={{
        hasLoaded: true,
        configcat: {
          etlEnableBigQueryPrivateAlpha: 'all',
          etlEnableDucklakePrivateAlpha: '',
          etlEnableSnowflakePrivateAlpha: '',
          etlEnableClickHousePrivateAlpha: '',
          pipelineCreationWizard: false,
        },
        posthog: {},
      }}
    >
      <ReplicationClusterProvider clusterId={clusterId}>
        <PipelineRequestStatusProvider>
          <DestinationPanel />
        </PipelineRequestStatusProvider>
      </ReplicationClusterProvider>
    </FeatureFlagContext.Provider>,
    { queryClient, nuqs: { hasMemory: true, searchParams: '?destinationType=BigQuery' } }
  )
}

test('retries source discovery and opens creation when only another region is enabled', async () => {
  mockRegions()
  mockProject(FRANKFURT.region_code)
  const unavailableClusters = new Set([FRANKFURT.cluster_id])
  mockPanelResources(new Set([FRANKFURT.cluster_id]), unavailableClusters)
  renderPanel()

  expect(await screen.findByText('Failed to retrieve pipeline sources')).toBeVisible()
  expect(screen.queryByText('Enable Pipelines')).not.toBeInTheDocument()
  expect(screen.queryByLabelText('Pipeline name')).not.toBeInTheDocument()

  unavailableClusters.clear()
  await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
  expect(await screen.findByLabelText('Pipeline name')).toBeVisible()
  expect(screen.queryByText('Enable Pipelines')).not.toBeInTheDocument()
})

test('opens the panel with a source only in a non-default region', async () => {
  mockRegions()
  mockProject(FRANKFURT.region_code)
  mockPanelResources(new Set([FRANKFURT.cluster_id]))
  renderPanel()

  expect(await screen.findByText('Frankfurt')).toBeVisible()
})

test('uses the default region when the project region lookup fails', async () => {
  mockRegions()
  mockProject()
  mockPanelResources(new Set([null]))
  renderPanel()

  expect(await screen.findByText('Singapore')).toBeVisible()
})

test('prepares the source in the preferred region before loading its publications', async () => {
  mockRegions()
  mockProject(FRANKFURT.region_code)
  const enabledClusters = new Set<string | null>([null])
  mockPanelResources(enabledClusters)
  const writes: (string | null)[] = []
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/tenants-sources',
    response: ({ request }) => {
      const cluster = clusterFrom(request)
      writes.push(cluster)
      enabledClusters.add(cluster)
      return HttpResponse.json<components['schemas']['CreateTenantSourceResponse_Output']>({
        tenant_id: 'default',
        source_id: 1,
      })
    },
  })
  renderPanel()

  expect(await screen.findByText('Frankfurt')).toBeVisible()
  await userEvent.click(await screen.findByText('Select publication'))
  expect(await screen.findByText('frankfurt')).toBeVisible()
  expect(writes).toEqual([FRANKFURT.cluster_id])
  expect(screen.queryByRole('combobox', { name: 'Pipeline region' })).not.toBeInTheDocument()
})
