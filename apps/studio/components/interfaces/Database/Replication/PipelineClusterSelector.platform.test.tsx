import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { parseAsString, useQueryState } from 'nuqs'
import { Button } from 'ui'
import { describe, expect, it } from 'vitest'

import { PipelineRegionReadonly } from './DestinationPanel/DestinationForm/PipelineRegionField'
import { PipelineClusterScope } from './PipelineClusterScope'
import { PipelineClusterSelector } from './PipelineClusterSelector'
import { useCreateDestinationPipelineMutation } from '@/data/replication/create-destination-pipeline-mutation'
import { useCreateTenantSourceMutation } from '@/data/replication/create-tenant-source-mutation'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type Pipeline = components['schemas']['PipelinesResponse_Output']['pipelines'][number]
const pipeline = (clusterId: string): Pipeline => ({
  id: '42',
  cluster_id: clusterId,
  tenant_id: 'default',
  source_id: 1,
  source_name: 'source',
  destination_id: 2,
  destination_name: clusterId === '1' ? 'Singapore pipeline' : 'Frankfurt pipeline',
  replicator_id: 3,
  config: { publication_name: 'publication' },
})

const Resources = () => {
  const { data } = useReplicationPipelinesQuery({ projectRef: 'default' })
  const source = useCreateTenantSourceMutation()
  const create = useCreateDestinationPipelineMutation()
  const [selectedCluster] = useQueryState('cluster_id', parseAsString)
  return (
    <>
      <PipelineClusterSelector />
      <PipelineRegionReadonly />
      <p>Selected: {selectedCluster ?? 'environment default'}</p>
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

const mockClusters = () =>
  addAPIMock({
    method: 'get',
    path: '/platform/replication/regions',
    response: () =>
      HttpResponse.json<components['schemas']['PipelineRegionsResponse_Output']>({
        default_cluster_id: '1',
        regions: [
          { cluster_id: '1', aws_region: 'ap-southeast-1', name: 'Singapore' },
          { cluster_id: '2', aws_region: 'eu-central-1', name: 'Frankfurt' },
          { cluster_id: '3', aws_region: 'us-east-1', name: 'Virginia' },
        ],
      }),
  })

describe('pipeline cluster selection', () => {
  it('uses the sole discovered cluster without showing a selector', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/regions',
      response: () =>
        HttpResponse.json<components['schemas']['PipelineRegionsResponse_Output']>({
          default_cluster_id: '1',
          regions: [{ cluster_id: '1', aws_region: 'ap-southeast-1', name: 'Singapore' }],
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines',
      response: ({ request }) =>
        HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({
          pipelines: [pipeline(new URL(request.url).searchParams.get('cluster_id') ?? 'missing')],
        }),
    })
    customRender(
      <PipelineClusterScope>
        <Resources />
      </PipelineClusterScope>,
      { nuqs: { hasMemory: true } }
    )
    expect(await screen.findByText('Singapore pipeline')).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Pipeline cluster' })).not.toBeInTheDocument()
  })

  it('loads the default, isolates identical IDs, and creates resources in the selected cluster', async () => {
    mockClusters()
    const reads: string[] = []
    const writes: string[] = []
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines',
      response: ({ request }) => {
        const id = new URL(request.url).searchParams.get('cluster_id') ?? 'missing'
        reads.push(id)
        return HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({
          pipelines: [pipeline(id)],
        })
      },
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/tenants-sources',
      response: ({ request }) => {
        writes.push(`source:${new URL(request.url).searchParams.get('cluster_id')}`)
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
        writes.push(`pipeline:${new URL(request.url).searchParams.get('cluster_id')}`)
        return HttpResponse.json<components['schemas']['CreateDestinationPipelineResponse_Output']>(
          { pipeline_id: '42', destination_id: 2 }
        )
      },
    })
    customRender(
      <PipelineClusterScope>
        <Resources />
      </PipelineClusterScope>,
      { nuqs: { hasMemory: true } }
    )
    expect(await screen.findByText('Singapore pipeline')).toBeInTheDocument()
    expect(reads).toEqual(['1'])
    expect(screen.getByText('ap-southeast-1')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('combobox', { name: 'Pipeline cluster' }))
    expect(within(await screen.findByRole('listbox')).getAllByRole('option')).toHaveLength(3)
    await userEvent.click(
      within(await screen.findByRole('listbox')).getByRole('option', {
        name: 'Frankfurt (eu-central-1)',
      })
    )
    expect(await screen.findByText('Frankfurt pipeline')).toBeInTheDocument()
    expect(screen.queryByText('Singapore pipeline')).not.toBeInTheDocument()
    expect(screen.getByText('Selected: 2')).toBeInTheDocument()
    expect(screen.getByText('eu-central-1')).toBeInTheDocument()
    expect(screen.queryByText('ap-southeast-1')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Create source' }))
    fireEvent.click(screen.getByRole('button', { name: 'Create pipeline' }))
    await waitFor(() => expect([...writes].sort()).toEqual(['pipeline:2', 'source:2']))
    expect(reads).toContain('2')
  })

  it('honors a deep link instead of the environment default', async () => {
    mockClusters()
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines',
      response: ({ request }) => {
        const clusterId = new URL(request.url).searchParams.get('cluster_id')
        return HttpResponse.json<components['schemas']['PipelinesResponse_Output']>({
          pipelines: [pipeline(clusterId ?? 'missing')],
        })
      },
    })
    customRender(
      <PipelineClusterScope>
        <Resources />
      </PipelineClusterScope>,
      { nuqs: { hasMemory: true, searchParams: '?cluster_id=2' } }
    )
    expect(await screen.findByText('Frankfurt pipeline')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Pipeline cluster' })).toHaveTextContent(
      'Frankfurt'
    )
  })
})
