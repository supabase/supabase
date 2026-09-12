import { act, renderHook } from '@testing-library/react'
import { type PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { BANNER_ID, BannerStackProvider, useBannerStack } from './BannerStackProvider'

const wrapper = ({ children }: PropsWithChildren) => (
  <BannerStackProvider>{children}</BannerStackProvider>
)

describe('BannerStackProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps a banner that is revived before the dismiss animation finishes', () => {
    const { result } = renderHook(() => useBannerStack(), { wrapper })

    act(() => {
      result.current.addBanner({
        id: BANNER_ID.LOGS_ALL_DEPRECATION,
        isDismissed: false,
        content: null,
      })
    })

    act(() => {
      result.current.dismissBanner(BANNER_ID.LOGS_ALL_DEPRECATION)
    })

    act(() => {
      result.current.addBanner({
        id: BANNER_ID.LOGS_ALL_DEPRECATION,
        isDismissed: false,
        content: null,
      })
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.banners).toEqual([
      expect.objectContaining({
        id: BANNER_ID.LOGS_ALL_DEPRECATION,
        isDismissed: false,
      }),
    ])
  })

  it('removes a banner after the dismiss animation when it stays dismissed', () => {
    const { result } = renderHook(() => useBannerStack(), { wrapper })

    act(() => {
      result.current.addBanner({
        id: BANNER_ID.LOGS_ALL_DEPRECATION,
        isDismissed: false,
        content: null,
      })
    })

    act(() => {
      result.current.dismissBanner(BANNER_ID.LOGS_ALL_DEPRECATION)
    })

    expect(result.current.banners[0]?.isDismissed).toBe(true)

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current.banners).toEqual([])
  })
})
