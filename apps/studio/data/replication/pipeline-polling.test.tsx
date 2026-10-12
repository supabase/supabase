import { focusManager, QueryClient, QueryObserver } from '@tanstack/react-query'
import { act, waitFor } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { replicationKeys } from './keys'
import { useReplicationPipelineReplicationStatusQuery } from './pipeline-replication-status-query'
import {
  replicationPipelineStatusQueryOptions,
  useReplicationPipelineStatusQuery,
  waitForPipelineStopped,
} from './pipeline-status-query'
import { customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock, type APIErrorBody } from '@/tests/lib/msw'

const variables = { projectRef: 'default', pipelineId: 1 }
const statusKey = replicationKeys.pipelinesStatus('default', 1)
type StatusResponse = components['schemas']['PipelineStatusResponse_Output']
type MetricsResponse = components['schemas']['PipelineReplicationStatusResponse_Output']
const stopped: StatusResponse = { pipeline_id: 1, status: { name: 'stopped' } }
const stopping: StatusResponse = { pipeline_id: 1, status: { name: 'stopping' } }
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => {
    resolve = complete
  })
  return { promise, resolve }
}

afterEach(() => {
  vi.useRealTimers()
  focusManager.setFocused(true)
})

describe('pipeline polling', () => {
  test.each([
    { endpoint: 'status', retryAfter: '30', delay: 30_000 },
    { endpoint: 'replication-status', retryAfter: '60', delay: 60_000 },
    { endpoint: 'status', retryAfter: undefined, delay: 30_000 },
  ] as const)(
    '$endpoint respects rate-limit backoff ($retryAfter) and resumes normal polling after recovery',
    async ({ endpoint, retryAfter, delay }) => {
      let requests = 0
      addAPIMock({
        method: 'get',
        path: `/platform/replication/:ref/pipelines/:pipeline_id/${endpoint}`,
        response: () => {
          requests += 1
          if (requests === 1) {
            return HttpResponse.json<APIErrorBody>(
              { message: 'Rate limited' },
              { status: 429, headers: retryAfter ? { 'Retry-After': retryAfter } : undefined }
            )
          }
          return endpoint === 'status'
            ? HttpResponse.json<StatusResponse>(stopped)
            : HttpResponse.json<MetricsResponse>({ pipeline_id: 1, table_statuses: [] })
        },
      })
      const useResource =
        endpoint === 'status'
          ? useReplicationPipelineStatusQuery
          : useReplicationPipelineReplicationStatusQuery
      vi.useFakeTimers()
      const { result, unmount } = customRenderHook(() => useResource(variables))
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0)
      })
      expect(result.current.isError).toBe(true)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(delay - 1)
      })
      expect(requests).toBe(1)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1)
      })
      expect(requests).toBe(2)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_000)
      })
      expect(result.current.isSuccess).toBe(true)
      expect(requests).toBe(3)
      unmount()
    }
  )

  test.each(['status', 'replication-status'] as const)(
    'shares slow %s requests and polls five seconds after completion',
    async (endpoint) => {
      const response = deferred<void>()
      const requests = vi.fn()
      const aborted = vi.fn()
      addAPIMock({
        method: 'get',
        path: `/platform/replication/:ref/pipelines/:pipeline_id/${endpoint}`,
        response: async ({ request }) => {
          requests()
          request.signal.addEventListener('abort', aborted)
          await response.promise
          return endpoint === 'status'
            ? HttpResponse.json<StatusResponse>(stopped)
            : HttpResponse.json<MetricsResponse>({
                pipeline_id: 1,
                apply_lag: null,
                table_statuses: [],
              })
        },
      })
      const queryClient = new QueryClient()
      // Exercise a background refresh with cached data, where invalidation can otherwise
      // cancel and replace a request that is already on the server.
      queryClient.setQueryData(
        endpoint === 'status'
          ? statusKey
          : replicationKeys.pipelinesReplicationStatus('default', 1),
        endpoint === 'status' ? stopped : { pipeline_id: 1, apply_lag: null, table_statuses: [] }
      )
      const useResource =
        endpoint === 'status'
          ? useReplicationPipelineStatusQuery
          : useReplicationPipelineReplicationStatusQuery
      const { result, unmount } = customRenderHook(
        () => ({ first: useResource(variables), second: useResource(variables) }),
        { queryClient }
      )
      await waitFor(() => expect(requests).toHaveBeenCalledTimes(1))
      vi.useFakeTimers()
      await act(async () => {
        await vi.advanceTimersByTimeAsync(5_000)
      })
      expect(requests).toHaveBeenCalledTimes(1)
      let refresh!: Promise<void>
      act(() => {
        refresh = queryClient.invalidateQueries(
          {
            queryKey:
              endpoint === 'status'
                ? statusKey
                : replicationKeys.pipelinesReplicationStatus('default', 1),
          },
          { cancelRefetch: false }
        )
      })
      await act(async () => {
        response.resolve()
        await refresh
      })
      expect(aborted).not.toHaveBeenCalled()
      expect(requests).toHaveBeenCalledTimes(1)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(4_999)
      })
      expect(result.current.first.isSuccess).toBe(true)
      expect(result.current.second.isSuccess).toBe(true)
      expect(requests).toHaveBeenCalledTimes(1)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1)
      })
      expect(requests).toHaveBeenCalledTimes(2)
      unmount()
      queryClient.clear()
    }
  )

  test('pauses dashboard polling while unfocused and refreshes on return', async () => {
    const requests = vi.fn()
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () => {
        requests()
        return HttpResponse.json<StatusResponse>(stopped)
      },
    })
    const { result } = customRenderHook(() => useReplicationPipelineStatusQuery(variables))
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    vi.useFakeTimers()
    focusManager.setFocused(false)
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(requests).toHaveBeenCalledTimes(1)
    await act(async () => {
      focusManager.setFocused(true)
      await vi.advanceTimersByTimeAsync(0)
    })
    expect(requests).toHaveBeenCalledTimes(2)
  })
})

describe('waiting for pipeline shutdown', () => {
  test('checks fresh status even when stopped is cached, sharing a dashboard request', async () => {
    const response = deferred<StatusResponse>()
    const requests = vi.fn()
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: async () => {
        requests()
        return HttpResponse.json<StatusResponse>(await response.promise)
      },
    })
    const queryClient = new QueryClient()
    queryClient.setQueryData(statusKey, stopped)
    const observer = new QueryObserver(
      queryClient,
      replicationPipelineStatusQueryOptions(variables)
    )
    const unsubscribe = observer.subscribe(() => {})
    await waitFor(() => expect(requests).toHaveBeenCalledTimes(1))
    const complete = vi.fn()
    const shutdown = waitForPipelineStopped(queryClient, variables).then(complete)
    expect(complete).not.toHaveBeenCalled()
    response.resolve(stopping)
    await waitFor(() => expect(queryClient.getQueryState(statusKey)?.fetchStatus).toBe('idle'))
    expect(complete).not.toHaveBeenCalled()
    expect(requests).toHaveBeenCalledTimes(1)
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () => HttpResponse.json<StatusResponse>(stopped),
    })
    await queryClient.invalidateQueries({ queryKey: statusKey }, { cancelRefetch: false })
    await shutdown
    expect(complete).toHaveBeenCalledOnce()
    unsubscribe()
    queryClient.clear()
  })

  test('rejects on timeout instead of proceeding with deletion', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () => HttpResponse.json<StatusResponse>(stopping),
    })
    const queryClient = new QueryClient()
    vi.useFakeTimers()
    const shutdown = waitForPipelineStopped(queryClient, variables)
    const rejection = expect(shutdown).rejects.toThrow('Pipeline is still stopping')
    await vi.advanceTimersByTimeAsync(30_000)
    await rejection
    expect(queryClient.getQueryCache().find({ queryKey: statusKey })?.getObserversCount()).toBe(0)
    queryClient.clear()
  })

  test('rejects if shutdown cannot be verified', async () => {
    addAPIMock({
      method: 'get',
      path: '/platform/replication/:ref/pipelines/:pipeline_id/status',
      response: () =>
        HttpResponse.json<APIErrorBody>({ message: 'Status unavailable' }, { status: 503 }),
    })
    const queryClient = new QueryClient()
    await expect(waitForPipelineStopped(queryClient, variables)).rejects.toMatchObject({
      message: 'Status unavailable',
    })
    expect(queryClient.getQueryCache().find({ queryKey: statusKey })?.getObserversCount()).toBe(0)
    queryClient.clear()
  })
})
