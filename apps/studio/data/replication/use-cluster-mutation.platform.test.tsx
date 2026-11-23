import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse } from 'msw'
import { Button } from 'ui'
import { expect, test } from 'vitest'

import {
  useReplicationPipelineStatusQuery,
  type ReplicationPipelineStatus,
  type ReplicationPipelineStatusResponse,
} from './pipeline-status-query'
import { useStartPipelineMutation } from './start-pipeline-mutation'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const PIPELINE_ID = '03h6pes1npx2ptvf052my5nx2'
const clusterFrom = (request: Request) => new URL(request.url).searchParams.get('cluster_id')

const DefaultPipelineActions = () => {
  const variables = { projectRef: 'default', pipelineId: PIPELINE_ID, clusterId: undefined }
  const { data } = useReplicationPipelineStatusQuery(variables, {
    staleTime: Infinity,
    refetchInterval: false,
  })
  const { mutate } = useStartPipelineMutation()

  return (
    <>
      <p>{data?.status.name}</p>
      <Button onClick={() => mutate(variables)}>Start default pipeline</Button>
    </>
  )
}

test('starts and refreshes the default pipeline with an explicitly undefined cluster', async () => {
  let status: ReplicationPipelineStatus = 'stopped'
  const reads: (string | null)[] = []
  const writes: (string | null)[] = []

  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
    response: ({ request }) => {
      const cluster = clusterFrom(request)
      reads.push(cluster)
      return HttpResponse.json<ReplicationPipelineStatusResponse>({
        pipeline_id: PIPELINE_ID,
        status: { name: cluster === null ? status : 'unknown' },
      })
    },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/start',
    response: ({ request }) => {
      const cluster = clusterFrom(request)
      writes.push(cluster)
      if (cluster === null) status = 'started'
      return HttpResponse.json<Record<string, never>>({})
    },
  })

  customRender(
    <ReplicationClusterProvider clusterId="2">
      <DefaultPipelineActions />
    </ReplicationClusterProvider>
  )

  expect(await screen.findByText('stopped')).toBeVisible()
  await userEvent.click(screen.getByRole('button', { name: 'Start default pipeline' }))
  await waitFor(() => expect(writes).toEqual([null]))
  expect(await screen.findByText('started')).toBeVisible()
  expect(reads).toEqual([null, null])
})
