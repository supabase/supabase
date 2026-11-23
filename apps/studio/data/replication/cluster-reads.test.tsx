import { screen } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { expect, test, vi } from 'vitest'

import { useReplicationCostEstimateQuery } from './cost-estimate-query'
import { useReplicationPipelineStatusQuery } from './pipeline-status-query'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

type PipelineStatusResponse = platformComponents['schemas']['PipelineStatusResponse_Output']

const pipelineId = '9007199254740993'
const clusterId = 'east-cluster-a'

function PipelineStatus({ override }: { override?: { clusterId?: string } }) {
  const { data } = useReplicationPipelineStatusQuery({
    projectRef: 'default',
    pipelineId,
    ...override,
  })

  return <p>{data && `${data.pipeline_id}: ${data.status.name}`}</p>
}

test('reads the same pipeline ID independently in the scoped and default clusters', async () => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
    response: ({ params, request }) => {
      const requestedCluster = new URL(request.url).searchParams.get('cluster_id')
      if (
        params.pipeline_id !== pipelineId ||
        (requestedCluster !== null && requestedCluster !== clusterId)
      ) {
        return HttpResponse.json<APIErrorBody>({ message: 'Unknown pipeline' }, { status: 404 })
      }

      return HttpResponse.json<PipelineStatusResponse>({
        pipeline_id: params.pipeline_id,
        status: { name: requestedCluster === null ? 'stopped' : 'started' },
      })
    },
  })

  customRender(
    <ReplicationClusterProvider clusterId={clusterId}>
      <PipelineStatus />
      <PipelineStatus override={{ clusterId: undefined }} />
    </ReplicationClusterProvider>
  )

  expect(await screen.findByText(`${pipelineId}: started`)).toBeInTheDocument()
  expect(await screen.findByText(`${pipelineId}: stopped`)).toBeInTheDocument()
})

test('shares the project cost estimate across default and scoped consumers', async () => {
  const respond = vi.fn(() =>
    HttpResponse.json<platformComponents['schemas']['CostEstimateResponse_Output']>({
      currency: 'usd',
      pipeline: { hourly_cost: 0.05, monthly_cost: 36.5 },
      streaming: { rate_per_gb: 3 },
      table_copy: { rate_per_gb: 0.6, total_bytes: 0, total_cost: 0, tables: [] },
    })
  )
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/sources/:source_id/publications/:publication_name/cost-estimate',
    response: respond,
  })

  function PublicationCost({ scope }: { scope: string }) {
    const { data } = useReplicationCostEstimateQuery({
      projectRef: 'default',
      sourceId: 1,
      publicationName: 'analytics',
    })
    return <p>{data && `${scope} monthly cost: ${data.pipeline.monthly_cost}`}</p>
  }

  customRender(
    <>
      <PublicationCost scope="Default" />
      <ReplicationClusterProvider clusterId={clusterId}>
        <PublicationCost scope="Cluster" />
      </ReplicationClusterProvider>
    </>
  )

  expect(await screen.findByText('Default monthly cost: 36.5')).toBeInTheDocument()
  expect(await screen.findByText('Cluster monthly cost: 36.5')).toBeInTheDocument()
  expect(respond).toHaveBeenCalledTimes(1)
})
