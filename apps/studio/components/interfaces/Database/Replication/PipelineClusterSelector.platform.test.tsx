import { QueryClient } from '@tanstack/react-query'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { parseAsString, useQueryState } from 'nuqs'
import { useState } from 'react'
import { Button } from 'ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useEnsurePipelineRegionSource } from './CreatePipeline/useEnsurePipelineRegionSource'
import {
  PipelineRegionField,
  PipelineRegionReadonly,
} from './DestinationPanel/DestinationForm/PipelineRegionField'
import { PipelineClusterScope } from './PipelineClusterScope'
import { PipelineClusterSelector } from './PipelineClusterSelector'
import { getPreferredClusterId } from '@/data/replication/clusters-query'
import { useCreateDestinationPipelineMutation } from '@/data/replication/create-destination-pipeline-mutation'
import { useCreateTenantSourceMutation } from '@/data/replication/create-tenant-source-mutation'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'
import { routerMock } from '@/tests/lib/route-mock'

type Pipeline = components['schemas']['PipelinesResponse_Output']['pipelines'][number]
type Regions = components['schemas']['PipelineRegionsResponse_Output']

const SINGAPORE = { cluster_id: '1', region_code: 'ap-southeast-1', region_name: 'Singapore' }
const FRANKFURT = { cluster_id: '2', region_code: 'eu-central-1', region_name: 'Frankfurt' }

const requestedCluster = (request: Request) =>
  new URL(request.url).searchParams.get('cluster_id') ?? 'omitted'

const pipeline = (cluster: string): Pipeline => ({
  id: '42',
  cluster_id: cluster === 'omitted' ? '1' : cluster,
  tenant_id: 'default',
  source_id: 1,
  source_name: 'source',
  destination_id: 2,
  destination_name: cluster === '2' ? 'Frankfurt pipeline' : 'Singapore pipeline',
  replicator_id: 3,
  config: { publication_name: 'publication' },
})

const Resources = ({ onCreated }: { onCreated?: () => void }) => {
  const { data } = useReplicationPipelinesQuery({ projectRef: 'default' }, { staleTime: Infinity })
  const source = useCreateTenantSourceMutation()
  const create = useCreateDestinationPipelineMutation({ onSuccess: onCreated })
  const [selectedCluster] = useQueryState('cluster_id', parseAsString)
  return (
    <>
      <PipelineClusterSelector />
      <PipelineRegionReadonly />
      <p>{`Selected: ${selectedCluster ?? 'environment default'}`}</p>
      {data?.pipelines.map((item) => (
        <p key={item.id}>{item.destination_name}</p>
      ))}
      <Button onClick={() => source.mutate({ projectRef: 'default' })}>Create source</Button>
      <Button
        onClick={() =>
          create.mutate({
            projectRef: 'default',
            destinationName: 'analytics',
            sourceId: 1,
            destinationConfig: {
              clickHouse: {
                url: 'http://127.0.0.1:8123',
                user: 'default',
                password: 'placeholder',
                database: 'analytics',
                engine: 'replacing_merge_tree',
              },
            },
            pipelineConfig: {
              publicationName: 'publication',
              tableSyncCopy: { type: 'include_all_tables' },
            },
          })
        }
      >
        Create pipeline
      </Button>
    </>
  )
}

const mockRegions = (regions: Regions['regions'] = [SINGAPORE, FRANKFURT]) =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/regions',
    response: () => HttpResponse.json<Regions>({ default_cluster_id: '1', regions }),
  })

const trackRequests = () => {
  const reads: string[] = []
  const writes: string[] = []
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines',
    response: ({ request }) => {
      reads.push(requestedCluster(request))
      return HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({
        pipelines: [pipeline(requestedCluster(request))],
      })
    },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/tenants-sources',
    response: ({ request }) => {
      writes.push(`source:${requestedCluster(request)}`)
      return HttpResponse.json<components['schemas']['CreateTenantSourceResponse_Output']>({
        tenant_id: 'default',
        source_id: 1,
      })
    },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/destinations-pipelines',
    response: ({ request }) => {
      writes.push(`pipeline:${requestedCluster(request)}`)
      return HttpResponse.json<components['schemas']['CreateDestinationPipelineResponse_Output']>({
        pipeline_id: '42',
        destination_id: 2,
      })
    },
  })
  return { reads, writes }
}

const mockProjectRegion = (region: string) => {
  routerMock.setCurrentUrl('/project/default/database/pipelines/new')
  const project: components['schemas']['ProjectDetailResponse_Output'] = {
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
    region,
    restUrl: 'https://default.supabase.co',
    status: 'ACTIVE_HEALTHY',
    subscription_id: 'subscription-1',
    updated_at: '2026-01-01T00:00:00.000Z',
  }
  addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: project })
}

const renderScope = (searchParams?: string, onCreated?: () => void) =>
  customRender(
    <PipelineClusterScope>
      <Resources onCreated={onCreated} />
    </PipelineClusterScope>,
    {
      queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
      nuqs: { hasMemory: true, searchParams },
    }
  )

const pickRegion = async (name: string) => {
  await userEvent.click(screen.getByRole('combobox', { name: 'Pipeline region' }))
  await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name }))
}

describe('pipeline region selection', () => {
  beforeEach(() => mockProjectRegion(SINGAPORE.region_code))

  it('hides the picker and omits cluster_id with a single region', async () => {
    mockRegions([SINGAPORE])
    const { reads, writes } = trackRequests()
    renderScope()

    expect(await screen.findByText('Singapore pipeline')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Pipeline region' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create pipeline' }))
    await waitFor(() => expect(writes).toEqual(['pipeline:omitted']))
    expect(reads[0]).toBe('omitted')
  })

  it('defaults to the API default region and sends cluster_id only for other regions', async () => {
    mockRegions()
    const { reads, writes } = trackRequests()
    renderScope()

    expect(await screen.findByText('Singapore pipeline')).toBeInTheDocument()
    expect(reads).toEqual(['omitted'])
    expect(screen.getByRole('combobox', { name: 'Pipeline region' })).toHaveTextContent(
      'Singapore (ap-southeast-1)'
    )

    await pickRegion('Frankfurt (eu-central-1)')
    expect(await screen.findByText('Frankfurt pipeline')).toBeInTheDocument()
    expect(screen.getByText('Selected: 2')).toBeInTheDocument()
    expect(screen.getByText('eu-central-1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create source' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create pipeline' }))
    await waitFor(() => expect([...writes].sort()).toEqual(['pipeline:2', 'source:2']))

    await pickRegion('Singapore (ap-southeast-1)')
    expect(await screen.findByText('Selected: environment default')).toBeInTheDocument()
    expect(screen.getByText('Singapore pipeline')).toBeInTheDocument()
  })

  it.each([
    ['?cluster_id=2', 'Frankfurt pipeline', '2'],
    ['?cluster_id=1', 'Singapore pipeline', 'omitted'],
  ])('honors the deep link %s', async (searchParams, name, cluster) => {
    mockRegions()
    const { reads } = trackRequests()
    renderScope(searchParams)

    expect(await screen.findByText(name)).toBeInTheDocument()
    expect(reads).toEqual([cluster])
  })

  it('falls back to the default cluster when region discovery fails', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/regions',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Temporarily unavailable' }, { status: 503 }),
    })
    const { reads } = trackRequests()
    renderScope()

    expect(await screen.findByText('Singapore pipeline')).toBeInTheDocument()
    expect(reads).toEqual(['omitted'])
    expect(screen.queryByRole('combobox', { name: 'Pipeline region' })).not.toBeInTheDocument()
  })

  it('completes a pending create in its original region after the selection changes', async () => {
    mockRegions()
    const onCreated = vi.fn()
    const reads: string[] = []
    const writes: string[] = []
    let finishCreate = () => {}
    const pendingCreate = new Promise<void>((resolve) => {
      finishCreate = resolve
    })
    let hasCreatedPipeline = false
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines',
      response: ({ request }) => {
        const cluster = requestedCluster(request)
        reads.push(cluster)
        const item = pipeline(cluster)
        if (cluster === 'omitted' && hasCreatedPipeline)
          item.destination_name = 'Created in Singapore'
        return HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({
          pipelines: [item],
        })
      },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/destinations-pipelines',
      response: async ({ request }) => {
        writes.push(requestedCluster(request))
        await pendingCreate
        hasCreatedPipeline = true
        return HttpResponse.json<components['schemas']['CreateDestinationPipelineResponse_Output']>(
          { pipeline_id: 'created-in-default', destination_id: 2 }
        )
      },
    })
    renderScope(undefined, onCreated)

    await screen.findByText('Singapore pipeline')
    fireEvent.click(screen.getByRole('button', { name: 'Create pipeline' }))
    await waitFor(() => expect(writes).toEqual(['omitted']))
    await pickRegion('Frankfurt (eu-central-1)')
    await screen.findByText('Frankfurt pipeline')
    finishCreate()
    await waitFor(() => expect(onCreated).toHaveBeenCalledOnce())
    expect(reads.filter((cluster) => cluster === '2')).toHaveLength(1)
    await pickRegion('Singapore (ap-southeast-1)')
    expect(await screen.findByText('Created in Singapore')).toBeInTheDocument()
  })

  describe('region source for creation', () => {
    const EnsureSource = () => {
      const { ensureRegionSource } = useEnsurePipelineRegionSource('default')
      const [result, setResult] = useState<string>('idle')
      return (
        <Button onClick={async () => setResult(String(await ensureRegionSource()))}>
          {`Ensure source: ${result}`}
        </Button>
      )
    }

    const mockSources = (writes: string[]) => {
      addAPIMock({
        method: 'get',
        path: '/platform/replication/:ref/sources',
        response: ({ request }) =>
          HttpResponse.json<components['schemas']['SourcesResponse_Output']>({
            sources:
              requestedCluster(request) === '2' && !writes.includes('source:2')
                ? []
                : [
                    {
                      id: 1,
                      name: 'default',
                      tenant_id: 'default',
                      config: {
                        host: 'localhost',
                        port: 5432,
                        name: 'postgres',
                        username: 'postgres',
                      },
                    },
                  ],
          }),
      })
    }

    it.each([
      [undefined, []],
      ['?cluster_id=2', ['source:2']],
    ])('creates a source only in a region without one (%s)', async (searchParams, expected) => {
      mockRegions()
      const { writes } = trackRequests()
      mockSources(writes)
      customRender(
        <PipelineClusterScope>
          <EnsureSource />
        </PipelineClusterScope>,
        {
          queryClient: new QueryClient({ defaultOptions: { queries: { retry: false } } }),
          nuqs: { hasMemory: true, searchParams },
        }
      )

      fireEvent.click(await screen.findByRole('button', { name: 'Ensure source: idle' }))
      expect(await screen.findByRole('button', { name: 'Ensure source: true' })).toBeInTheDocument()
      expect(writes).toEqual(expected)
    })
  })

  describe('side panel region field', () => {
    const RegionField = ({ onRegionChange }: { onRegionChange: (id?: string) => void }) => {
      const [clusterId, setClusterId] = useState<string>()
      return (
        <ReplicationClusterProvider clusterId={clusterId}>
          <PipelineRegionField
            destinationType="BigQuery"
            onRegionChange={(id) => {
              setClusterId(id)
              onRegionChange(id)
            }}
          />
        </ReplicationClusterProvider>
      )
    }

    it('keeps the static region row with a single region', async () => {
      mockRegions([SINGAPORE])
      customRender(<RegionField onRegionChange={vi.fn()} />)

      expect(await screen.findByText(/All pipelines run from this region/)).toBeInTheDocument()
      expect(screen.queryByRole('combobox', { name: 'Pipeline region' })).not.toBeInTheDocument()
    })

    it('lets the user pick a region and maps the default region to no cluster_id', async () => {
      mockRegions([{ cluster_id: '1', region_code: null, region_name: 'Local' }, FRANKFURT])
      const onRegionChange = vi.fn()
      customRender(<RegionField onRegionChange={onRegionChange} />)

      expect(await screen.findByRole('combobox', { name: 'Pipeline region' })).toHaveTextContent(
        'Local'
      )
      await pickRegion('Frankfurt (eu-central-1)')
      expect(onRegionChange).toHaveBeenLastCalledWith('2')
      expect(screen.getByRole('combobox', { name: 'Pipeline region' })).toHaveTextContent(
        'Frankfurt (eu-central-1)'
      )
      await pickRegion('Local')
      expect(onRegionChange).toHaveBeenLastCalledWith(undefined)
    })
  })

  describe('preferred region', () => {
    const regions = { default_cluster_id: '1', regions: [SINGAPORE, FRANKFURT] }

    it('prefers the cluster in the project region, otherwise the default', () => {
      expect(getPreferredClusterId(regions, 'eu-central-1')).toBe('2')
      expect(getPreferredClusterId(regions, 'ap-southeast-1')).toBeUndefined()
      expect(getPreferredClusterId(regions, 'us-east-1')).toBeUndefined()
      expect(getPreferredClusterId(regions, undefined)).toBeUndefined()
      expect(getPreferredClusterId(undefined, 'eu-central-1')).toBeUndefined()
    })

    it('starts a new pipeline in the project region', async () => {
      mockRegions()
      mockProjectRegion('eu-central-1')
      trackRequests()
      renderScope()

      expect(await screen.findByText('Selected: 2')).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: 'Pipeline region' })).toHaveTextContent(
        'Frankfurt (eu-central-1)'
      )
    })

    it('keeps a deep-linked region over the project region', async () => {
      mockRegions()
      mockProjectRegion('eu-central-1')
      trackRequests()
      renderScope('?cluster_id=1')

      expect(await screen.findByText('Singapore pipeline')).toBeInTheDocument()
      expect(screen.getByText('Selected: 1')).toBeInTheDocument()
    })
  })
})
