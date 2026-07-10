import { act, render, renderHook, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { registerFunnelErrorToast, ToastErrorTracker } from './toast-errors'
import { useTrackFunnelError } from '@/lib/telemetry/use-track-funnel-error'

const { mockTrack } = vi.hoisted(() => ({ mockTrack: vi.fn() }))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mockTrack }))

describe('ToastErrorTracker', () => {
  beforeEach(() => {
    mockTrack.mockReset()
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('tracks an unregistered error toast without funnel properties', async () => {
    render(<ToastErrorTracker />)
    act(() => {
      toast.error('request failed')
    })
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('dashboard_error_created', { source: 'toast' })
    )
    expect(mockTrack).toHaveBeenCalledTimes(1)
  })

  it('fires a single enriched event for a registered funnel toast', async () => {
    render(<ToastErrorTracker />)
    act(() => {
      registerFunnelErrorToast(toast.error('funnel error'), {
        origin: 'signup',
        errorCategory: 'api',
        errorReason: 'other',
        errorCode: 500,
      })
    })
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('dashboard_error_created', {
        source: 'toast',
        origin: 'signup',
        errorCategory: 'api',
        errorReason: 'other',
        errorCode: 500,
      })
    )
    expect(mockTrack).toHaveBeenCalledTimes(1)
  })

  it('routes toast-sourced funnel errors from useTrackFunnelError into one enriched event', async () => {
    render(<ToastErrorTracker />)
    const { result } = renderHook(() => useTrackFunnelError())
    act(() => {
      const toastId = toast.error('funnel failure')
      result.current(
        'project_creation',
        { errorCategory: 'api', errorReason: 'rate_limited', errorCode: 429 },
        'toast',
        toastId
      )
    })
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('dashboard_error_created', {
        source: 'toast',
        origin: 'project_creation',
        errorCategory: 'api',
        errorReason: 'rate_limited',
        errorCode: 429,
      })
    )
    expect(mockTrack).toHaveBeenCalledTimes(1)
  })

  it('ignores non-error toasts', async () => {
    render(<ToastErrorTracker />)
    act(() => {
      toast.success('all good')
    })
    act(() => {
      toast.error('unmarked sentinel')
    })
    await waitFor(() => expect(mockTrack).toHaveBeenCalledTimes(1))
  })

  it('skips error toasts that lose the sampling draw', async () => {
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.5)
    render(<ToastErrorTracker />)
    act(() => {
      toast.error('sampled out')
    })
    act(() => {
      toast.error('sampled in')
    })
    await waitFor(() => expect(mockTrack).toHaveBeenCalledTimes(1))
  })
})
