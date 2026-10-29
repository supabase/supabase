// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { posthogClient, useFeatureFlags, useSearchParamsShallow } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useGettingStartedVariant } from './useGettingStartedVariant'

vi.mock('common', () => ({
  useConsentState: vi.fn(() => ({ hasAccepted: true })),
  useMountEffect: vi.fn(),
  posthogClient: { captureExperimentExposure: vi.fn() },
  useFeatureFlags: vi.fn(),
  useSearchParamsShallow: vi.fn(),
}))

const FLAG = 'docs-getting-started-v2'
const captureExposure = vi.mocked(posthogClient.captureExperimentExposure)

const renderVariant = ({
  flagValue,
  override,
}: {
  flagValue?: string | boolean
  override?: string
}) => {
  const query = new URLSearchParams(override ? { [FLAG]: override } : {})
  window.history.replaceState(null, '', `/?${query}`)
  vi.mocked(useFeatureFlags).mockReturnValue({
    posthog: flagValue === undefined ? {} : { [FLAG]: flagValue },
    hasLoaded: flagValue !== undefined,
  } as unknown as ReturnType<typeof useFeatureFlags>)
  vi.mocked(useSearchParamsShallow).mockReturnValue(
    query as unknown as ReturnType<typeof useSearchParamsShallow>
  )
  return renderHook(() => useGettingStartedVariant())
}

describe('useGettingStartedVariant', () => {
  beforeEach(() => {
    captureExposure.mockClear()
  })

  it('returns the stepper and records its exposure', () => {
    const { result } = renderVariant({ flagValue: 'stepper' })

    expect(result.current).toEqual({ variant: 'stepper', isReady: true })
    expect(captureExposure).toHaveBeenCalledWith(FLAG, { variant: 'stepper' }, true)
  })

  it('stays hidden on control until the flags load', () => {
    const { result } = renderVariant({})

    expect(result.current).toEqual({ variant: 'control', isReady: false })
    expect(captureExposure).not.toHaveBeenCalled()
  })

  it('shows control without exposure for visitors outside the experiment', () => {
    const { result } = renderVariant({ flagValue: false })

    expect(result.current.variant).toBe('control')
    expect(captureExposure).not.toHaveBeenCalled()
  })

  it('records no exposure when the query param forces the stepper', () => {
    const { result } = renderVariant({ flagValue: 'control', override: 'stepper' })

    expect(result.current).toEqual({ variant: 'stepper', isReady: true })
    expect(captureExposure).not.toHaveBeenCalled()
  })
})
