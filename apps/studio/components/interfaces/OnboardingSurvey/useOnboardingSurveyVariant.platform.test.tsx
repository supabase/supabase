import { renderHook } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useOnboardingSurveyVariant } from './useOnboardingSurveyVariant'
import { createMockAuthContext, createMockSession } from '@/tests/lib/auth-helpers'
import { CustomWrapper } from '@/tests/lib/custom-render'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'

const SIGNED_IN_USER_ID = createMockSession().user.id

const track = vi.hoisted(() => vi.fn())
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => track }))

type RenderOptions = {
  isSignedIn?: boolean
  /** null stands for flags that were fetched logged out */
  flagsUserId?: string | null
  isProfileLoaded?: boolean
}

const renderVariantHook = (
  flagValue: string | boolean | undefined,
  { isSignedIn = true, flagsUserId = SIGNED_IN_USER_ID, isProfileLoaded = true }: RenderOptions = {}
) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <FeatureFlagContext.Provider
      value={{
        configcat: {},
        // An empty store reads as "flags not loaded yet"
        posthog: flagValue === undefined ? {} : { onboardingSurveyPlacement: flagValue },
        hasLoaded: true,
        userId: flagsUserId ?? undefined,
      }}
    >
      <CustomWrapper
        authContext={isSignedIn ? createMockAuthContext() : undefined}
        profileContext={createMockProfileContext({
          isLoading: !isProfileLoaded,
          isSuccess: isProfileLoaded,
        })}
      >
        {children}
      </CustomWrapper>
    </FeatureFlagContext.Provider>
  )
  return renderHook(() => useOnboardingSurveyVariant(), { wrapper })
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
  it.each<[string, RenderOptions]>([
    ['a logged-out visitor', { isSignedIn: false, flagsUserId: null, isProfileLoaded: false }],
    ['flags fetched before sign-in', { flagsUserId: null }],
    ['flags fetched for another user', { flagsUserId: 'another-user' }],
  ])('returns no arm and records no exposure for %s', (_, options) => {
    const { result } = renderVariantHook('org_form', options)

    expect(result.current.variant).toBeUndefined()
    expect(track).not.toHaveBeenCalled()
  })

  it('returns the arm but holds exposure until the profile loads', () => {
    const { result } = renderVariantHook('org_form', { isProfileLoaded: false })

    expect(result.current.variant).toBe('org_form')
    expect(track).not.toHaveBeenCalled()
  })
})
