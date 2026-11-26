import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { FeatureFlagContext } from 'common'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'

import { DestinationPanel } from './DestinationPanel'
import { organizationKeys } from '@/data/organizations/keys'
import type { OrganizationsData } from '@/data/organizations/organizations-query'
import type { ReplicationCostEstimateData } from '@/data/replication/cost-estimate-query'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

mockAnimationsApi()

const SINGAPORE = { cluster_id: '1', region_code: 'ap-southeast-1', region_name: 'Singapore' }
const FRANKFURT = { cluster_id: '2', region_code: 'eu-central-1', region_name: 'Frankfurt' }
const clusterFrom = (request: Request) => new URL(request.url).searchParams.get('cluster_id')

const mockRegions = (isUnavailable = () => false) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/regions',
    response: () =>
      isUnavailable()
        ? HttpResponse.json<APIErrorBody>({ message: 'Regions unavailable' }, { status: 503 })
        : HttpResponse.json<components['schemas']['PipelineRegionsResponse_Output']>({
            default_cluster_id: SINGAPORE.cluster_id,
            regions: [SINGAPORE, FRANKFURT],
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

const findRegionSelector = () => screen.findByRole('combobox', { name: 'Pipeline region' })

const choosePublication = async (name: string) => {
  await userEvent.click(await screen.findByText('Select publication'))
  await userEvent.click(await screen.findByText(name))
}

test.each(['regions', 'sources'])(
  'retries %s discovery and uses the source in its own cluster',
  async (failure) => {
    let isRegionsUnavailable = failure === 'regions'
    mockRegions(() => isRegionsUnavailable)
    mockProject(FRANKFURT.region_code)
    const unavailableClusters = new Set(failure === 'sources' ? [FRANKFURT.cluster_id] : [])
    mockPanelResources(new Set([FRANKFURT.cluster_id]), unavailableClusters)
    renderPanel()

    expect(await screen.findByText('Failed to retrieve pipeline sources')).toBeVisible()
    expect(screen.queryByText('Enable Pipelines')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Pipeline name')).not.toBeInTheDocument()

    unavailableClusters.clear()
    isRegionsUnavailable = false
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByLabelText('Pipeline name')).toBeVisible()
    await userEvent.click(await screen.findByText('Select publication'))
    expect(await screen.findByText('frankfurt')).toBeVisible()
    expect(screen.queryByText('Enable Pipelines')).not.toBeInTheDocument()
  }
)

test('opens the panel with a source only in a non-default region', async () => {
  mockRegions()
  mockProject(FRANKFURT.region_code)
  mockPanelResources(new Set([FRANKFURT.cluster_id]))
  renderPanel()

  expect(await findRegionSelector()).toHaveTextContent('Frankfurt (eu-central-1)')
})

test('prepares the environment default from a non-default region context', async () => {
  mockRegions()
  mockProject(FRANKFURT.region_code)
  const enabledClusters = new Set<string | null>([FRANKFURT.cluster_id])
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
  renderPanel(FRANKFURT.cluster_id)

  const selector = await findRegionSelector()
  expect(selector).toHaveTextContent('Frankfurt (eu-central-1)')
  await waitFor(() => expect(selector).toBeEnabled())
  await userEvent.click(selector)
  const options = within(await screen.findByRole('listbox')).getAllByRole('option')
  expect(options.map((option) => option.textContent)).toEqual([
    'Frankfurt (eu-central-1)',
    'Singapore (ap-southeast-1)',
  ])
  await userEvent.click(options[1])
  await waitFor(() => expect(selector).toBeEnabled())
  await userEvent.click(await screen.findByText('Select publication'))
  expect(await screen.findByText('singapore')).toBeVisible()
  expect(selector).toHaveTextContent('Singapore (ap-southeast-1)')
  expect(writes).toEqual([null])
})

test('keeps region selection available when the project region lookup fails', async () => {
  mockRegions()
  mockProject()
  mockPanelResources(new Set([null]))
  renderPanel()

  const selector = await findRegionSelector()
  expect(selector).toHaveTextContent('Singapore (ap-southeast-1)')
  await waitFor(() => expect(selector).toBeEnabled())
})

test('locks the region selector while saving the pipeline', async () => {
  mockRegions()
  mockProject(SINGAPORE.region_code)
  mockPanelResources(new Set([null]))
  addAPIMock({
    method: 'get',
    path: '/platform/replication/v2/:ref/sources/:source_id/publications/:publication_name',
    response: {
      name: 'singapore',
      config: {
        type: 'tables',
        tables: [],
        operations: ['insert'],
        publish_via_partition_root: false,
      },
      tables: [],
    },
  })
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources/:source_id/publications/:publication_name/cost-estimate',
    response: () =>
      HttpResponse.json<ReplicationCostEstimateData>({
        currency: 'usd',
        pipeline: { hourly_cost: 0.05, monthly_cost: 36.5 },
        streaming: { rate_per_gb: 3 },
        table_copy: { rate_per_gb: 0.6, total_bytes: 0, total_cost: 0, tables: [] },
      }),
  })
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/destinations/validate',
    response: { validation_failures: [] },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/pipelines/validate',
    response: { validation_failures: [] },
  })
  const pendingSave = Promise.withResolvers<void>()
  const saveRequested = Promise.withResolvers<void>()
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/destinations-pipelines',
    response: async () => {
      saveRequested.resolve()
      await pendingSave.promise
      return HttpResponse.json<APIErrorBody>({ message: 'Create failed' }, { status: 500 })
    },
  })
  renderPanel()

  try {
    const selector = await findRegionSelector()
    await choosePublication('singapore')
    const fields = {
      'Pipeline name': 'Warehouse',
      'Project ID': 'my-project',
      'Dataset ID': 'dataset',
      'Service account key': '{}',
    }
    for (const [name, value] of Object.entries(fields)) {
      fireEvent.change(screen.getByLabelText(name), { target: { value } })
    }
    const submit = screen.getByRole('button', { name: 'Start pipeline' })
    await waitFor(() => expect(submit).toBeEnabled())
    fireEvent.click(submit)
    const confirm = await screen.findByRole('button', { name: 'Create and start pipeline' })
    await waitFor(() => expect(confirm).toBeEnabled())
    await userEvent.click(confirm)
    await saveRequested.promise
    await waitFor(() => expect(selector).toBeDisabled())
    pendingSave.resolve()
    await waitFor(() => expect(selector).toBeEnabled())
  } finally {
    pendingSave.resolve()
  }
})

test.each(['success', 'creation failure', 'refresh failure'])(
  'prepares the preferred region and loads publications after %s',
  async (scenario) => {
    mockRegions()
    mockProject(FRANKFURT.region_code)
    const enabledClusters = new Set<string | null>([null])
    const unavailableClusters = new Set<string | null>()
    mockPanelResources(enabledClusters, unavailableClusters)
    const writes: (string | null)[] = []
    let shouldFail = scenario !== 'success'
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/tenants-sources',
      response: ({ request }) => {
        const cluster = clusterFrom(request)
        writes.push(cluster)
        if (shouldFail && scenario === 'creation failure') {
          return HttpResponse.json<APIErrorBody>(
            { message: 'Source creation unavailable' },
            { status: 503 }
          )
        }
        enabledClusters.add(cluster)
        if (shouldFail) unavailableClusters.add(cluster)
        return HttpResponse.json<components['schemas']['CreateTenantSourceResponse_Output']>({
          tenant_id: 'default',
          source_id: 1,
        })
      },
    })
    renderPanel()

    expect(await findRegionSelector()).toHaveTextContent('Frankfurt (eu-central-1)')
    if (shouldFail) {
      expect(await screen.findByText('Failed to prepare pipeline region')).toBeVisible()
      expect(screen.getByRole('button', { name: 'Start pipeline' })).toBeDisabled()
      shouldFail = false
      unavailableClusters.clear()
      await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
      await waitFor(() =>
        expect(screen.queryByText('Failed to prepare pipeline region')).not.toBeInTheDocument()
      )
    }
    await userEvent.click(await screen.findByText('Select publication'))
    expect(await screen.findByText('frankfurt')).toBeVisible()
    expect(writes).toEqual(
      scenario === 'creation failure'
        ? [FRANKFURT.cluster_id, FRANKFURT.cluster_id]
        : [FRANKFURT.cluster_id]
    )
  }
)
