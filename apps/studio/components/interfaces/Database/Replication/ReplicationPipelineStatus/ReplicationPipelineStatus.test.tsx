import { screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { ReplicationPipelineStatus } from './ReplicationPipelineStatus'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useParams: () => ({ ref: 'default', pipelineId: '42' }),
}))

type PipelineResponse = components['schemas']['PipelineResponse_Output']
type PipelineStatusResponse = components['schemas']['PipelineStatusResponse_Output']
type PipelineReplicationStatusResponse =
  components['schemas']['PipelineReplicationStatusResponse_Output']

describe('ReplicationPipelineStatus', () => {
  test('preserves the overview structure while pipeline details load', async () => {
    let resolvePipeline: (pipeline: PipelineResponse) => void = () => {}
    const pipelineResponse = new Promise<PipelineResponse>((resolve) => {
      resolvePipeline = resolve
    })

    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id',
      response: async () => HttpResponse.json<PipelineResponse>(await pipelineResponse),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () =>
        HttpResponse.json<PipelineStatusResponse>({ pipeline_id: 42, status: { name: 'started' } }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/replication-status',
      response: () =>
        HttpResponse.json<PipelineReplicationStatusResponse>({
          pipeline_id: 42,
          apply_lag: {
            active: true,
            wal_status: 'reserved',
            restart_lsn_bytes: 0,
            confirmed_flush_lsn_bytes: 0,
            safe_wal_size_bytes: null,
          },
          table_statuses: [],
        }),
    })

    customRender(
      <PipelineRequestStatusProvider>
        <ReplicationPipelineStatus />
      </PipelineRequestStatusProvider>
    )

    expect(screen.getByRole('status')).toHaveTextContent('Loading pipeline details')
    expect(screen.getByRole('heading', { name: 'Pipeline health' })).toBeVisible()
    expect(screen.getByRole('heading', { name: 'Replicated tables' })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Table' })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeVisible()
    expect(screen.getByRole('columnheader', { name: 'Details' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Configuration' })).not.toBeInTheDocument()

    resolvePipeline({
      id: 42,
      config: { publication_name: 'analytics_publication' },
      destination_id: 7,
      destination_name: 'Analytics warehouse',
      replicator_id: 1,
      source_id: 2,
      source_name: 'main-db',
      tenant_id: 'default',
    })

    expect(await screen.findByText('No table data yet')).toBeVisible()
    expect(screen.getByRole('status')).toHaveTextContent('')
  })
})
