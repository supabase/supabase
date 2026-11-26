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

const mockPanelResources = (
  enabledClusters: Set<string | null>,
  unavailableClusters = new Set<string | null>()
) => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/destinations',
    response: () =>
      HttpResponse.json<components['schemas']['DestinationsResponse_Output']>({ destinations: [] }),
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

const renderPanel = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  queryClient.setQueryData<OrganizationsData>(organizationKeys.list(), [])
  customRender(
    <FeatureFlagContext.Provider
      value={{
        hasLoaded: true,
        configcat: {
          etlEnableBigQueryPrivateAlpha: 'all',
          pipelineCreationWizard: false,
        },
        posthog: {},
      }}
    >
      <PipelineRequestStatusProvider>
        <DestinationPanel clusterId={undefined} />
      </PipelineRequestStatusProvider>
    </FeatureFlagContext.Provider>,
    { queryClient, nuqs: { hasMemory: true, searchParams: '?destinationType=BigQuery' } }
  )
}

test.each(['regions', 'sources'])(
  'retries %s discovery and uses the source in its own cluster',
  async (failure) => {
    let isRegionsUnavailable = failure === 'regions'
    mockRegions(() => isRegionsUnavailable)
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
