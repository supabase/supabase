import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'

import {
  PipelineRequestStatusProvider,
  PipelineStatusRequestStatus as Status,
  usePipelineRequestStatus,
} from './replication-pipeline-request-status'

const setup = () => renderHook(usePipelineRequestStatus, { wrapper: PipelineRequestStatusProvider })
afterEach(() => vi.useRealTimers())

describe('pipeline request state', () => {
  test('keeps restart intent through shutdown and replacement', async () => {
    const { result } = setup()
    await act(async () => {
      await result.current.runWithRequestStatus(
        1,
        Status.RestartRequested,
        'started',
        async () => {}
      )
    })
    for (const status of ['stopping', 'stopped', 'starting']) {
      act(() => result.current.updatePipelineStatus(1, status))
      expect(result.current.getRequestStatus(1)).toBe(Status.RestartRequested)
    }
    act(() => result.current.updatePipelineStatus(1, 'started'))
    expect(result.current.getRequestStatus(1)).toBe(Status.None)
  })

  test.each([
    {
      request: Status.StartRequested,
      initial: 'stopped',
      intermediate: 'starting',
      final: 'started',
    },
    {
      request: Status.StopRequested,
      initial: 'started',
      intermediate: 'stopping',
      final: 'stopped',
    },
    {
      request: Status.RestartRequested,
      initial: 'failed',
      intermediate: 'starting',
      final: 'failed',
    },
  ])(
    'clears $request only at its final backend state',
    async ({ request, initial, intermediate, final }) => {
      const { result } = setup()
      await act(async () => {
        await result.current.runWithRequestStatus(1, request, initial, async () => {})
      })
      act(() => result.current.updatePipelineStatus(1, intermediate))
      expect(result.current.getRequestStatus(1)).toBe(request)
      act(() => result.current.updatePipelineStatus(1, final))
      expect(result.current.getRequestStatus(1)).toBe(Status.None)
    }
  )

  test('does not expire an in-flight request or clear it on an early status change', async () => {
    vi.useFakeTimers()
    const { result } = setup()
    let complete = () => {}
    const response = new Promise<void>((resolve) => {
      complete = resolve
    })
    let operation: Promise<void>
    act(() => {
      operation = result.current.runWithRequestStatus(
        1,
        Status.StartRequested,
        'stopped',
        () => response
      )
    })
    act(() => {
      result.current.updatePipelineStatus(1, 'started')
      vi.advanceTimersByTime(60_000)
    })
    expect(result.current.getRequestStatus(1)).toBe(Status.StartRequested)
    await act(async () => {
      complete()
      await operation
    })
    expect(result.current.getRequestStatus(1)).toBe(Status.None)
  })

  test('allows retry immediately after a request error', async () => {
    const { result } = setup()
    await act(async () => {
      await expect(
        result.current.runWithRequestStatus(1, Status.StopRequested, 'started', async () => {
          throw new Error('Stop failed')
        })
      ).rejects.toThrow('Stop failed')
    })
    expect(result.current.getRequestStatus(1)).toBe(Status.None)
  })

  test('falls back to backend status if a completed request never produces a transition', async () => {
    vi.useFakeTimers()
    const { result } = setup()
    await act(async () => {
      await result.current.runWithRequestStatus(
        1,
        Status.RestartRequested,
        'started',
        async () => {}
      )
    })
    act(() => result.current.updatePipelineStatus(1, 'started'))
    expect(result.current.getRequestStatus(1)).toBe(Status.RestartRequested)
    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(result.current.getRequestStatus(1)).toBe(Status.None)
  })
})
