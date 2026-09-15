import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { replicationKeys } from './keys'
import {
  useReplicationPipelineReplicationStatusQuery,
  type ReplicationPipelineReplicationStatusData,
} from './pipeline-replication-status-query'
import {
  useReplicationPipelineStatusQuery,
  type ReplicationPipelineStatusResponse,
} from './pipeline-status-query'
import { useRestartPipelineMutation } from './restart-pipeline-mutation'
import { useRollbackTablesMutation } from './rollback-tables-mutation'
import { useStartPipelineMutation } from './start-pipeline-mutation'
import { useStopPipelineMutation } from './stop-pipeline-mutation'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const variables = { projectRef: 'default', pipelineId: 1, target: { type: 'all_tables' as const } }
const statusKey = replicationKeys.pipelinesStatus(variables.projectRef, variables.pipelineId)

const operations = [
  { action: 'start', useMutation: useStartPipelineMutation },
  { action: 'restart', useMutation: useRestartPipelineMutation },
  { action: 'stop', useMutation: useStopPipelineMutation },
  { action: 'rollback-tables', useMutation: useRollbackTablesMutation },
] as const

describe('pipeline lifecycle status', () => {
  test('refreshes committed table resets when runtime recreation fails', async () => {
    let hasReset = false
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () =>
        HttpResponse.json<ReplicationPipelineStatusResponse>({
          pipeline_id: 1,
          status: { name: 'stopped' },
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/replication-status',
      response: () =>
        HttpResponse.json<ReplicationPipelineReplicationStatusData>({
          pipeline_id: 1,
          apply_lag: null,
          table_statuses: [
            {
              id: 1,
              schema: 'public',
              name: 'orders',
              table_id: 1,
              table_name: 'public.orders',
              state: { name: hasReset ? 'queued' : 'following_wal' },
            },
          ],
        }),
    })
    addAPIMock({
      method: 'post',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/rollback-tables',
      response: () => {
        hasReset = true
        return HttpResponse.json<APIErrorBody>({ message: 'Runtime unavailable' }, { status: 503 })
      },
    })
    const { result } = customRenderHook(() => ({
      tables: useReplicationPipelineReplicationStatusQuery(variables, { refetchInterval: false }),
      rollback: useRollbackTablesMutation({ onError: () => {} }),
    }))
    await waitFor(() =>
      expect(result.current.tables.data?.table_statuses[0].state.name).toBe('following_wal')
    )
    await act(async () => {
      await expect(result.current.rollback.mutateAsync(variables)).rejects.toMatchObject({
        message: 'Runtime unavailable',
      })
    })
    await waitFor(() =>
      expect(result.current.tables.data?.table_statuses[0].state.name).toBe('queued')
    )
  })

  test.each(['starting', 'stopping'] as const)('polls promptly while %s', async (initialStatus) => {
    let hasResponded = false
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () => {
        const response: ReplicationPipelineStatusResponse = {
          pipeline_id: 1,
          status: { name: hasResponded ? 'started' : initialStatus },
        }
        hasResponded = true
        return HttpResponse.json<ReplicationPipelineStatusResponse>(response)
      },
    })
    const { result } = customRenderHook(() => useReplicationPipelineStatusQuery(variables))
    await waitFor(() => expect(result.current.data?.status.name).toBe(initialStatus))
    await waitFor(() => expect(result.current.data?.status.name).toBe('started'), {
      timeout: 5_000,
    })
  })

  test.each(operations)(
    '$action preserves the status fetched after success',
    async ({ action, useMutation }) => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      const response: ReplicationPipelineStatusResponse = {
        pipeline_id: 1,
        status: { name: action === 'stop' ? 'stopped' : 'started' },
      }
      addAPIMock({
        method: 'get',
        path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
        response: () => HttpResponse.json<ReplicationPipelineStatusResponse>(response),
      })
      addAPIMock({
        method: 'post',
        path: `/platform/replication/:ref/pipelines/:pipeline_id/${action}`,
        response: () =>
          HttpResponse.json<{ pipeline_id: number; tables: [] }>({ pipeline_id: 1, tables: [] }),
      })
      const { result } = customRenderHook(
        () => ({
          status: useReplicationPipelineStatusQuery(variables, { refetchInterval: false }),
          mutation: useMutation(),
        }),
        { queryClient }
      )
      await waitFor(() => expect(result.current.status.isSuccess).toBe(true))
      await act(async () => {
        await result.current.mutation.mutateAsync(variables)
      })
      expect(result.current.status.data).toEqual(response)
      expect(queryClient.getQueryData(statusKey)).toEqual(response)
    }
  )

  test.each(operations.flatMap((operation) => [409, 503].map((code) => ({ ...operation, code }))))(
    '$action refreshes status after HTTP $code',
    async ({ action, useMutation, code }) => {
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
      let response: ReplicationPipelineStatusResponse = {
        pipeline_id: 1,
        status: { name: 'started' },
      }
      addAPIMock({
        method: 'get',
        path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
        response: () => HttpResponse.json<ReplicationPipelineStatusResponse>(response),
      })
      addAPIMock({
        method: 'post',
        path: `/platform/replication/:ref/pipelines/:pipeline_id/${action}`,
        response: () => {
          response = { pipeline_id: 1, status: { name: 'stopping' } }
          return HttpResponse.json<APIErrorBody>({ message: 'Operation pending' }, { status: code })
        },
      })
      const { result } = customRenderHook(
        () => ({
          status: useReplicationPipelineStatusQuery(variables, { refetchInterval: false }),
          mutation: useMutation({ onError: () => {} }),
        }),
        { queryClient }
      )
      await waitFor(() => expect(result.current.status.isSuccess).toBe(true))
      await act(async () => {
        await expect(result.current.mutation.mutateAsync(variables)).rejects.toMatchObject({
          message: 'Operation pending',
        })
      })
      await waitFor(() => expect(result.current.status.data?.status.name).toBe('stopping'))
    }
  )
})
