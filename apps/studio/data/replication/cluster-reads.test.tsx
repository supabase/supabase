import { screen } from '@testing-library/react'
import type { platformComponents } from 'api-types'
import { HttpResponse } from 'msw'
import { expect, test } from 'vitest'

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
