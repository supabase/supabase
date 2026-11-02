// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { useFeatureFlags, useSearchParamsShallow } from 'common'
import { describe, expect, it, vi } from 'vitest'

import { IA_NAV_FLAG } from './constants'
import * as option1NavItems from './option1.constants'
import { useNavItems } from './useNavItems'
import * as currentNavItems from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'

vi.mock('common', () => ({
  useConsentState: vi.fn(() => ({ hasAccepted: true })),
  posthogClient: { captureExperimentExposure: vi.fn() },
  useFeatureFlags: vi.fn(),
  useSearchParamsShallow: vi.fn(() => new URLSearchParams()),
}))

function renderNavItems(flagValue: string | boolean) {
  vi.mocked(useFeatureFlags).mockReturnValue({
    posthog: { [IA_NAV_FLAG]: flagValue },
  } as unknown as ReturnType<typeof useFeatureFlags>)
  vi.mocked(useSearchParamsShallow).mockReturnValue(
    new URLSearchParams() as unknown as ReturnType<typeof useSearchParamsShallow>
  )

  return renderHook(() => useNavItems()).result.current
}

describe('useNavItems', () => {
  it("returns today's navigation with the flag off", () => {
    expect(renderNavItems(false)).toBe(currentNavItems)
  })

  it('returns the Option 1 navigation with the flag on', () => {
    expect(renderNavItems('option-1')).toBe(option1NavItems)
  })
})
