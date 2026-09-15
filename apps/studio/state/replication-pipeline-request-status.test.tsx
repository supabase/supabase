import { QueryClient } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { HttpResponse } from 'msw'
import { describe, expect, test } from 'vitest'

import {
  PipelineRequestStatusProvider,
  PipelineStatusRequestStatus as Status,
  usePipelineRequestStatus,
} from './replication-pipeline-request-status'
import { replicationKeys } from '@/data/replication/keys'
import {
  replicationPipelineStatusQueryOptions,
  type ReplicationPipelineStatusResponse,
} from '@/data/replication/pipeline-status-query'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

const setup = () => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const options = replicationPipelineStatusQueryOptions({ projectRef: 'default', pipelineId: 1 })
  queryClient.setQueryData(options.queryKey, { pipeline_id: 1, status: { name: 'started' } })
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
    'hands over to the next backend response, including an unchanged status: %s',
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
      expect(result.current.getRequestStatus(1)).toBe(Status.None)
      // Displaying backend truth must not allow another action while the request is in flight.
      expect(result.current.isRequestPending(1)).toBe(true)
      await act(async () => {
        action.resolve()
        await operation
      })
      expect(result.current.isRequestPending(1)).toBe(false)
    }
  )

  test('keeps immediate start feedback until a network response arrives', async () => {
    const { result, queryClient, refresh } = setup()
    await act(async () => {
      await result.current.runWithRequestStatus(1, Status.StartRequested, async () => {})
    })
    act(() => {
      queryClient.setQueryData(replicationKeys.pipelinesStatus('default', 1), {
        pipeline_id: 1,
        status: { name: 'stopped' },
      })
    })
    expect(result.current.getRequestStatus(1)).toBe(Status.StartRequested)
    await refresh('starting')
    expect(result.current.getRequestStatus(1)).toBe(Status.None)
  })

  test('does not let another pipeline response clear the pending display', async () => {
    const { result, queryClient } = setup()
    await act(async () => {
      await result.current.runWithRequestStatus(1, Status.StopRequested, async () => {})
      await queryClient.fetchQuery({
        queryKey: replicationKeys.pipelinesStatus('default', 2),
        queryFn: async () => ({ pipeline_id: 2, status: { name: 'started' } }),
      })
    })
    expect(result.current.getRequestStatus(1)).toBe(Status.StopRequested)
  })

  test('keeps a stopped pipeline unchanged while guarding its table reset', async () => {
    const { result } = setup()
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

  test('allows retry immediately after a request error', async () => {
    const { result } = setup()
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
