// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { posthogClient, useFeatureFlags, useSearchParamsShallow } from 'common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { IA_NAV_FLAG } from './constants'
import { useIaNavVariant } from './useIaNavVariant'

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
  isOverrideLoaded = true,
}: {
  flagValue?: string | boolean
  override?: string
  isOverrideLoaded?: boolean
}) {
  const posthog = flagValue === undefined ? {} : { [IA_NAV_FLAG]: flagValue }
  const query = new URLSearchParams(override ? { [IA_NAV_FLAG]: override } : {})
  // useSearchParamsShallow starts empty and reads the URL in an effect after mount.
  const searchParams = isOverrideLoaded ? query : new URLSearchParams()

  window.history.replaceState(null, '', `/?${query}`)
  vi.mocked(useFeatureFlags).mockReturnValue({ posthog } as unknown as ReturnType<
    typeof useFeatureFlags
  >)
  vi.mocked(useSearchParamsShallow).mockReturnValue(
    searchParams as unknown as ReturnType<typeof useSearchParamsShallow>
  )

  return renderHook(() => useIaNavVariant())
}

describe('useIaNavVariant', () => {
  beforeEach(() => {
    captureExposure.mockClear()
  })

  it('returns option-1 and records its exposure', () => {
    const { result } = renderVariant({ flagValue: 'option-1' })

    expect(result.current).toBe('option-1')
    expect(captureExposure).toHaveBeenCalledWith(IA_NAV_FLAG, { variant: 'option-1' }, true)
  })

  it('records control exposure for visitors in the control group', () => {
    const { result } = renderVariant({ flagValue: 'control' })

    expect(result.current).toBe('control')
    expect(captureExposure).toHaveBeenCalledWith(IA_NAV_FLAG, { variant: 'control' }, true)
  })

  it('falls back to control without exposure for visitors outside the experiment', () => {
    const { result } = renderVariant({ flagValue: false })

    expect(result.current).toBe('control')
    expect(captureExposure).not.toHaveBeenCalled()
  })

  it('records no exposure when the query param forces option-1', () => {
    const { result } = renderVariant({ flagValue: 'control', override: 'option-1' })

    expect(result.current).toBe('option-1')
    expect(captureExposure).not.toHaveBeenCalled()
  })

  it('records no exposure before the forcing query param loads', () => {
    renderVariant({ flagValue: 'control', override: 'option-1', isOverrideLoaded: false })

    expect(captureExposure).not.toHaveBeenCalled()
  })

  it('ignores an unknown query param value', () => {
    const { result } = renderVariant({ flagValue: 'option-1', override: 'nope' })

    expect(result.current).toBe('option-1')
    expect(captureExposure).toHaveBeenCalledWith(IA_NAV_FLAG, { variant: 'option-1' }, true)
  })
})
