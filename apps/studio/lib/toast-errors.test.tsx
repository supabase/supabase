import { act, render, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { markToastAsTracked, ToastErrorTracker } from './toast-errors'

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

  it('tracks an unmarked error toast', async () => {
    render(<ToastErrorTracker />)
    act(() => {
      toast.error('request failed')
    })
    await waitFor(() =>
      expect(mockTrack).toHaveBeenCalledWith('dashboard_error_created', { source: 'toast' })
    )
    expect(mockTrack).toHaveBeenCalledTimes(1)
  })

  it('skips a toast marked as tracked', async () => {
    render(<ToastErrorTracker />)
    act(() => {
      markToastAsTracked(toast.error('funnel error tracked at the call site'))
    })
    act(() => {
      toast.error('unmarked sentinel')
    })
    await waitFor(() => expect(mockTrack).toHaveBeenCalledTimes(1))
    expect(mockTrack).toHaveBeenCalledWith('dashboard_error_created', { source: 'toast' })
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
