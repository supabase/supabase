import { createFileRoute } from '@tanstack/react-router'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { parseAsString, useQueryState } from 'nuqs'
import { Button } from 'ui'
import { expect, test } from 'vitest'

import { PipelineStatePill } from './PipelineStatePill'
import { RowMenu } from './RowMenu'
import {
  useReplicationPipelineStatusQuery,
  type ReplicationPipelineStatus,
  type ReplicationPipelineStatusResponse,
} from '@/data/replication/pipeline-status-query'
import { ReplicationClusterProvider, useReplicationClusterId } from '@/state/replication-cluster'
import {
  PipelineRequestStatusProvider,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { addAPIMock } from '@/tests/lib/msw'
import { renderRoute } from '@/tests/lib/route-render'

mockAnimationsApi()

const FRANKFURT = '2'
const VIRGINIA = '3'
const PIPELINE_ID = '03h6pes1npx2ptvf052my5nx2'
const pipelineParams = { projectRef: 'default', pipelineId: PIPELINE_ID }
const queryOptions = { staleTime: Infinity, refetchInterval: false as const }
const clusterFrom = (request: Request) => new URL(request.url).searchParams.get('cluster_id')

const mockPipelineStatus = (statuses: Map<string | null, ReplicationPipelineStatus>) => {
  const reads: (string | null)[] = []
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
    response: ({ request }) => {
      const cluster = clusterFrom(request)
      reads.push(cluster)
      return HttpResponse.json<ReplicationPipelineStatusResponse>({
        pipeline_id: PIPELINE_ID,
        status: { name: statuses.get(cluster) ?? 'unknown' },
      })
    },
  })
  return reads
}

const PipelineActions = () => {
  const clusterId = useReplicationClusterId()
  const { data, error, isLoading, isError, isSuccess } = useReplicationPipelineStatusQuery(
    { ...pipelineParams, clusterId },
    queryOptions
  )
  const { getRequestStatus } = usePipelineRequestStatus()
  if (!clusterId) throw new Error('The pipeline actions require a cluster')
  return (
    <>
      <PipelineStatePill
        pipelineStatus={data?.status}
        requestStatus={getRequestStatus(PIPELINE_ID)}
        error={error}
        isLoading={isLoading}
        isError={isError}
        isSuccess={isSuccess}
      />
      <RowMenu
        destinationId={7}
        destinationType="BigQuery"
        pipeline={{
          id: PIPELINE_ID,
          cluster_id: clusterId,
          tenant_id: 'default',
          source_id: 1,
          source_name: 'default',
          destination_id: 7,
          destination_name: 'Warehouse',
          replicator_id: 8,
          config: { publication_name: 'publication' },
        }}
        pipelineStatus={data?.status}
        error={error}
        isLoading={isLoading}
        isError={isError}
        onDeleteClick={() => {}}
      />
    </>
  )
}

const RegionView = () => {
  const [clusterId, setClusterId] = useQueryState(
    'cluster_id',
    parseAsString.withDefault(FRANKFURT)
  )
  return (
    <PipelineRequestStatusProvider>
      <Button onClick={() => void setClusterId(FRANKFURT)}>Frankfurt</Button>
      <Button onClick={() => void setClusterId(VIRGINIA)}>Virginia</Button>
      <ReplicationClusterProvider clusterId={clusterId}>
        <PipelineActions />
      </ReplicationClusterProvider>
    </PipelineRequestStatusProvider>
  )
}

test('routes actions and refreshes to their original regions when pipeline IDs overlap', async () => {
  const statuses = new Map<string | null, ReplicationPipelineStatus>([
    [FRANKFURT, 'stopped'],
    [VIRGINIA, 'started'],
  ])
  const reads = mockPipelineStatus(statuses)
  const start = Promise.withResolvers<void>()
  const stop = Promise.withResolvers<void>()
  const writes: string[] = []

  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/start',
    response: async ({ request, params }) => {
      const cluster = clusterFrom(request)
      writes.push(`start:${cluster}:${params.pipeline_id}`)
      await start.promise
      statuses.set(cluster, 'started')
      return HttpResponse.json<Record<string, never>>({})
    },
  })
  addAPIMock({
    method: 'post',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/stop',
    response: async ({ request, params }) => {
      const cluster = clusterFrom(request)
      writes.push(`stop:${cluster}:${params.pipeline_id}`)
      await stop.promise
      statuses.set(cluster, 'stopped')
      return HttpResponse.json<Record<string, never>>({}, { status: 202 })
    },
  })

  const routeId = '/project/$ref/database/pipelines/'
  await renderRoute(createFileRoute(routeId)({ component: RegionView }), {
    routeId,
    url: '/project/default/database/pipelines',
    nuqs: { hasMemory: true },
  })
  const user = userEvent.setup()
  const chooseAction = async (name: string) => {
    await user.click(screen.getByRole('button', { name: 'Pipeline options' }))
    await user.click(await screen.findByRole('menuitem', { name }))
  }

  try {
    expect(await screen.findByText('Stopped')).toBeVisible()
    await chooseAction('Start pipeline')
    expect(await screen.findByText('Starting')).toBeVisible()
    await waitFor(() => expect(writes).toEqual([`start:${FRANKFURT}:${PIPELINE_ID}`]))

    await user.click(screen.getByRole('button', { name: 'Virginia' }))
    expect(await screen.findByText('Running')).toBeVisible()
    await chooseAction('Stop pipeline')
    expect(await screen.findByText('Stopping')).toBeVisible()
    await waitFor(() =>
      expect(writes).toEqual([
        `start:${FRANKFURT}:${PIPELINE_ID}`,
        `stop:${VIRGINIA}:${PIPELINE_ID}`,
      ])
    )

    start.resolve()
    await waitFor(() => expect(reads).toEqual([FRANKFURT, VIRGINIA, FRANKFURT]))
    expect(screen.getByText('Stopping')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Frankfurt' }))
    expect(await screen.findByText('Running')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Virginia' }))
    expect(screen.getByText('Stopping')).toBeVisible()
    stop.resolve()
    expect(await screen.findByText('Stopped')).toBeVisible()
  } finally {
    start.resolve()
    stop.resolve()
  }
})
