import { renderHook } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useOnboardingSurveyVariant } from './useOnboardingSurveyVariant'
import { CustomWrapper } from '@/tests/lib/custom-render'

const track = vi.hoisted(() => vi.fn())
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => track }))

type RenderOptions = {
  hasFlagsForSignedInUser?: boolean
  isFormExposed?: boolean
}

const renderVariantHook = (
  flagValue: string | boolean | undefined,
  { hasFlagsForSignedInUser = true, isFormExposed = true }: RenderOptions = {}
) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <FeatureFlagContext.Provider
      value={{
        configcat: {},
        // An empty store reads as "flags not loaded yet"
        posthog: flagValue === undefined ? {} : { onboardingSurveyPlacement: flagValue },
        hasLoaded: true,
        hasFlagsForSignedInUser,
      }}
    >
      <CustomWrapper>{children}</CustomWrapper>
    </FeatureFlagContext.Provider>
  )
  return renderHook(() => useOnboardingSurveyVariant({ isFormExposed }), { wrapper })
}

describe('useOnboardingSurveyVariant', () => {
  beforeEach(() => {
    track.mockReset()
    localStorage.clear()
  })

  it.each(['control', 'org_form'])('records exposure once per mount for the %s arm', (arm) => {
    const { result, rerender } = renderVariantHook(arm)
    rerender()

    expect(result.current.variant).toBe(arm)
    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith('onboarding_survey_placement_experiment_exposed', {
      experiment_id: 'onboarding_survey_placement',
      variant: arm,
    })
  })

  // A flag value from an arm this build doesn't know must not put the user in the experiment
  it.each([
    ['an unknown arm', 'org_form_v2'],
    ['a user the flag has not assigned', false],
    ['flags that have not loaded', undefined],
  ])('gives the default form and records no exposure for %s', (_, flagValue) => {
    const { result } = renderVariantHook(flagValue)

    expect(result.current.variant).toBeUndefined()
    expect(track).not.toHaveBeenCalled()
  })

  // Logged-out requests all get the same arm, so only a signed-in user's own flags count
  it('returns no arm and records no exposure for flags not fetched for the signed-in user', () => {
    const { result } = renderVariantHook('org_form', { hasFlagsForSignedInUser: false })

    expect(result.current.variant).toBeUndefined()
    expect(track).not.toHaveBeenCalled()
  })

  it('returns the arm but holds exposure until the form is exposed', () => {
    const { result } = renderVariantHook('org_form', { isFormExposed: false })

    expect(result.current.variant).toBe('org_form')
    expect(track).not.toHaveBeenCalled()
  })
})
