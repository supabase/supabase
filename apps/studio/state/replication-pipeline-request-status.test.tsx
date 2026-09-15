import { QueryClient } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import {
  PipelineRequestStatusProvider,
  PipelineStatusRequestStatus as Status,
  usePipelineRequestStatus,
} from './replication-pipeline-request-status'
import {
  replicationPipelineStatusQueryOptions,
  type ReplicationPipelineStatusResponse,
} from '@/data/replication/pipeline-status-query'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const setup = (initialStatus: ReplicationPipelineStatusResponse['status']['name'] = 'started') => {
  addAPIMock({
    method: 'get',
    path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
    response: () =>
      HttpResponse.json<ReplicationPipelineStatusResponse>({
        pipeline_id: 1,
        status: { name: initialStatus },
      }),
  })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const options = replicationPipelineStatusQueryOptions({ projectRef: 'default', pipelineId: 1 })
  queryClient.setQueryData(options.queryKey, { pipeline_id: 1, status: { name: initialStatus } })
  const hook = renderHook(usePipelineRequestStatus, {
    wrapper: ({ children }) => (
      <CustomWrapper queryClient={queryClient}>
        <PipelineRequestStatusProvider>{children}</PipelineRequestStatusProvider>
      </CustomWrapper>
    ),
  })
  const refresh = async (name: ReplicationPipelineStatusResponse['status']['name']) => {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () =>
        HttpResponse.json<ReplicationPipelineStatusResponse>({ pipeline_id: 1, status: { name } }),
    })
    await act(async () => {
      await queryClient.fetchQuery(options)
    })
  }
  return { ...hook, queryClient, refresh }
}

const deferred = () => {
  let resolve = () => {}
  const promise = new Promise<void>((complete) => {
    resolve = complete
  })
  return { promise, resolve }
}

describe('pipeline request state', () => {
  test.each(['started', 'stopping', 'stopped', 'starting', 'failed', 'unknown'] as const)(
    'keeps feedback during the operation, then accepts a fresh status: %s',
    async (backendStatus) => {
      const { result, refresh } = setup()
      const action = deferred()
      let operation: Promise<void>
      act(() => {
        operation = result.current.runWithRequestStatus(
          1,
          Status.StopRequested,
          () => action.promise
        )
      })
      expect(result.current.getRequestStatus(1)).toBe(Status.StopRequested)
      await refresh(backendStatus)
      expect(result.current.getRequestStatus(1)).toBe(Status.StopRequested)
      // A read during the operation cannot acknowledge that the operation has completed.
      expect(result.current.isRequestPending(1)).toBe(true)
      await act(async () => {
        action.resolve()
        await operation
      })
      expect(result.current.isRequestPending(1)).toBe(false)
      expect(result.current.getRequestStatus(1)).toBe(Status.None)
    }
  )

  test('waits for an older in-flight read, then fetches afresh without overlapping requests', async () => {
    const { result, queryClient } = setup()
    const action = deferred()
    const oldRead = deferred()
    const freshRead = deferred()
    let reads = 0
    let activeReads = 0
    let maxActiveReads = 0
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: async () => {
        reads += 1
        activeReads += 1
        maxActiveReads = Math.max(maxActiveReads, activeReads)
        const isOldRead = reads === 1
        await (isOldRead ? oldRead.promise : freshRead.promise)
        activeReads -= 1
        return HttpResponse.json<ReplicationPipelineStatusResponse>({
          pipeline_id: 1,
          status: { name: isOldRead ? 'started' : 'starting' },
        })
      },
    })
    const options = replicationPipelineStatusQueryOptions({ projectRef: 'default', pipelineId: 1 })
    const oldFetch = queryClient.fetchQuery(options)
    await waitFor(() => expect(reads).toBe(1))
    let operation: Promise<void>
    act(() => {
      operation = result.current.runWithRequestStatus(1, Status.StopRequested, () => action.promise)
    })
    await act(async () => {
      action.resolve()
    })
    expect(reads).toBe(1)
    expect(result.current.getRequestStatus(1)).toBe(Status.StopRequested)
    await act(async () => {
      oldRead.resolve()
      await oldFetch
    })
    await waitFor(() => expect(reads).toBe(2))
    expect(result.current.getRequestStatus(1)).toBe(Status.StopRequested)
    await act(async () => {
      freshRead.resolve()
      await operation
    })
    expect(result.current.getRequestStatus(1)).toBe(Status.None)
    expect(queryClient.getQueryData(options.queryKey)?.status.name).toBe('starting')
    expect(maxActiveReads).toBe(1)
  })

  test('keeps a stopped pipeline unchanged while guarding its table reset', async () => {
    const { result } = setup('stopped')
    const action = deferred()
    let operation: Promise<void>
    act(() => {
      operation = result.current.runWithRequestStatus(1, Status.None, () => action.promise)
    })
    expect(result.current.getRequestStatus(1)).toBe(Status.None)
    expect(result.current.isRequestPending(1)).toBe(true)
    await act(async () => {
      action.resolve()
      await operation
    })
    expect(result.current.isRequestPending(1)).toBe(false)
  })

  test('preserves the operation error even when refreshing status also fails', async () => {
    const { result } = setup()
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Status unavailable' }, { status: 503 }),
    })
    await act(async () => {
      await expect(
        result.current.runWithRequestStatus(1, Status.StopRequested, async () => {
          throw new Error('Stop failed')
        })
      ).rejects.toThrow('Stop failed')
    })
    expect(result.current.getRequestStatus(1)).toBe(Status.None)
    expect(result.current.isRequestPending(1)).toBe(false)
  })

  test('an older action settling cannot clear a newer pending action', async () => {
    const { result } = setup()
    const older = deferred()
    const newer = deferred()
    let first: Promise<void>
    let second: Promise<void>
    act(() => {
      first = result.current.runWithRequestStatus(1, Status.StopRequested, () => older.promise)
      second = result.current.runWithRequestStatus(1, Status.StartRequested, () => newer.promise)
    })
    await act(async () => {
      older.resolve()
      await first
    })
    expect(result.current.getRequestStatus(1)).toBe(Status.StartRequested)
    expect(result.current.isRequestPending(1)).toBe(true)
    await act(async () => {
      newer.resolve()
      await second
    })
  })
})
