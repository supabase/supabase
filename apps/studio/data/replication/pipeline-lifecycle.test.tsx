import { QueryClient } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import { replicationKeys } from './keys'
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
