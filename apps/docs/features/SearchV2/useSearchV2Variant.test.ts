// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { posthogClient, useFeatureFlags, useSearchParamsShallow } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SEARCH_V2_FLAG } from './constants'
import { useSearchV2Variant } from './useSearchV2Variant'

vi.mock('common', () => ({
  useConsentState: vi.fn(() => ({ hasAccepted: true })),
  posthogClient: { captureExperimentExposure: vi.fn() },
  useFeatureFlags: vi.fn(),
  useSearchParamsShallow: vi.fn(),
}))

const captureExposure = vi.mocked(posthogClient.captureExperimentExposure)

function renderVariant({
  flagValue,
  override,
}: {
  flagValue?: string | boolean
  override?: string
}) {
  const posthog = flagValue === undefined ? {} : { [SEARCH_V2_FLAG]: flagValue }
  const searchParams = new URLSearchParams(override ? { [SEARCH_V2_FLAG]: override } : {})

  vi.mocked(useFeatureFlags).mockReturnValue({ posthog } as unknown as ReturnType<
    typeof useFeatureFlags
  >)
  vi.mocked(useSearchParamsShallow).mockReturnValue(
    searchParams as unknown as ReturnType<typeof useSearchParamsShallow>
  )

  return renderHook(() => useSearchV2Variant())
}

describe('useSearchV2Variant', () => {
  beforeEach(() => {
    captureExposure.mockClear()
  })

  it('returns the rollout variant and records its exposure', () => {
    const { result } = renderVariant({ flagValue: 'search-v2-active' })

    expect(result.current).toBe('search-v2-active')
    expect(captureExposure).toHaveBeenCalledWith(
      SEARCH_V2_FLAG,
      { variant: 'search-v2-active' },
      true
    )
  })

  it('records control exposure for visitors outside the rollout', () => {
    const { result } = renderVariant({ flagValue: false })

    expect(result.current).toBe('control')
    expect(captureExposure).toHaveBeenCalledWith(SEARCH_V2_FLAG, { variant: 'control' }, true)
  })

  it('records no exposure before the flag store loads', () => {
    const { result } = renderVariant({})

    expect(result.current).toBe('control')
    expect(captureExposure).not.toHaveBeenCalled()
  })

  it('records no exposure when the query param forces a variant', () => {
    const { result } = renderVariant({ flagValue: false, override: 'search-v2-active' })

    expect(result.current).toBe('search-v2-active')
    expect(captureExposure).not.toHaveBeenCalled()
  })
})
