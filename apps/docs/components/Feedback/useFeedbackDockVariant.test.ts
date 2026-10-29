// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { posthogClient, useFeatureFlags, useSearchParamsShallow } from 'common'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FEEDBACK_DOCK_FLAG, useFeedbackDockVariant } from './useFeedbackDockVariant'

vi.mock('common', () => ({
  useConsentState: vi.fn(() => ({ hasAccepted: true })),
  posthogClient: { captureExperimentExposure: vi.fn() },
  useFeatureFlags: vi.fn(),
  useSearchParamsShallow: vi.fn(),
}))

const captureExposure = vi.mocked(posthogClient.captureExperimentExposure)

const renderVariant = ({
  flagValue,
  override,
  hasLoaded = true,
}: {
  flagValue?: string | boolean
  override?: string
  hasLoaded?: boolean
}) => {
  const posthog = flagValue === undefined ? {} : { [FEEDBACK_DOCK_FLAG]: flagValue }
  const query = new URLSearchParams(override ? { [FEEDBACK_DOCK_FLAG]: override } : {})

  window.history.replaceState(null, '', `/?${query}`)
  vi.mocked(useFeatureFlags).mockReturnValue({ posthog, hasLoaded } as unknown as ReturnType<
    typeof useFeatureFlags
  >)
  vi.mocked(useSearchParamsShallow).mockReturnValue(
    query as unknown as ReturnType<typeof useSearchParamsShallow>
  )

  return renderHook(() => useFeedbackDockVariant())
}

describe('useFeedbackDockVariant', () => {
  beforeEach(() => {
    captureExposure.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns dock and records its exposure', () => {
    const { result } = renderVariant({ flagValue: 'dock' })

    expect(result.current).toBe('dock')
    expect(captureExposure).toHaveBeenCalledWith(FEEDBACK_DOCK_FLAG, { variant: 'dock' }, true)
  })

  it('records control exposure for visitors in the control group', () => {
    const { result } = renderVariant({ flagValue: 'control' })

    expect(result.current).toBe('control')
    expect(captureExposure).toHaveBeenCalledWith(FEEDBACK_DOCK_FLAG, { variant: 'control' }, true)
  })

  it('returns control without exposure for visitors outside the rollout', () => {
    const { result } = renderVariant({ flagValue: false })

    expect(result.current).toBe('control')
    expect(captureExposure).not.toHaveBeenCalled()
  })

  it('returns null until the flags load, then control after the timeout', () => {
    vi.useFakeTimers()
    const { result } = renderVariant({ hasLoaded: false })
    expect(result.current).toBeNull()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current).toBe('control')
  })

  it('lets the query param force a variant without recording exposure', () => {
    const { result } = renderVariant({ flagValue: 'control', override: 'dock', hasLoaded: false })

    expect(result.current).toBe('dock')
    expect(captureExposure).not.toHaveBeenCalled()
  })
})
