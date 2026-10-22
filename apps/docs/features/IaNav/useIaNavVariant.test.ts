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
}: {
  flagValue?: string | boolean
  override?: string
}) {
  const posthog = flagValue === undefined ? {} : { [IA_NAV_FLAG]: flagValue }
  const searchParams = new URLSearchParams(override ? { [IA_NAV_FLAG]: override } : {})

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

  it('falls back to control for visitors outside the experiment', () => {
    const { result } = renderVariant({ flagValue: false })

    expect(result.current).toBe('control')
    expect(captureExposure).toHaveBeenCalledWith(IA_NAV_FLAG, { variant: 'control' }, true)
  })

  it('records no exposure before the flag store loads', () => {
    const { result } = renderVariant({})

    expect(result.current).toBe('control')
    expect(captureExposure).not.toHaveBeenCalled()
  })

  it('records no exposure when the query param forces option-1', () => {
    const { result } = renderVariant({ flagValue: false, override: 'option-1' })

    expect(result.current).toBe('option-1')
    expect(captureExposure).not.toHaveBeenCalled()
  })

  it('ignores an unknown query param value', () => {
    const { result } = renderVariant({ flagValue: 'option-1', override: 'nope' })

    expect(result.current).toBe('option-1')
    expect(captureExposure).toHaveBeenCalledWith(IA_NAV_FLAG, { variant: 'option-1' }, true)
  })
})
