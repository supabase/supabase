import { renderHook } from '@testing-library/react'
import { FeatureFlagContext } from 'common'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useOnboardingSurveyVariant } from './useOnboardingSurveyVariant'
import { CustomWrapper } from '@/tests/lib/custom-render'

const USER_ID = 'user-1'

const mocks = vi.hoisted(() => ({
  track: vi.fn(),
  signedInUserId: undefined as string | undefined,
}))

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => mocks.track }))
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useUser: () => (mocks.signedInUserId ? { id: mocks.signedInUserId } : null),
}))

type RenderOptions = {
  signedInUserId?: string
  flagsUserId?: string
  isProfileLoaded?: boolean
}

const renderVariantHook = (
  flagValue: string | boolean | undefined,
  { signedInUserId, flagsUserId, isProfileLoaded }: RenderOptions = {
    signedInUserId: USER_ID,
    flagsUserId: USER_ID,
    isProfileLoaded: true,
  }
) => {
  mocks.signedInUserId = signedInUserId

  const wrapper = ({ children }: PropsWithChildren) => (
    <FeatureFlagContext.Provider
      value={{
        configcat: {},
        // An empty store reads as "flags not loaded yet"
        posthog: flagValue === undefined ? {} : { onboardingSurveyPlacement: flagValue },
        hasLoaded: true,
        userId: flagsUserId,
      }}
    >
      <CustomWrapper
        profileContext={{
          profile: undefined,
          error: null,
          isLoading: !isProfileLoaded,
          isError: false,
          isSuccess: !!isProfileLoaded,
        }}
      >
        {children}
      </CustomWrapper>
    </FeatureFlagContext.Provider>
  )
  return renderHook(() => useOnboardingSurveyVariant(), { wrapper })
}

describe('useOnboardingSurveyVariant', () => {
  beforeEach(() => {
    mocks.track.mockReset()
    localStorage.clear()
  })

  it.each(['control', 'org_form'])('records exposure for the %s arm', (arm) => {
    const { result, rerender } = renderVariantHook(arm)
    rerender()

    expect(result.current.variant).toBe(arm)
    expect(mocks.track).toHaveBeenCalledTimes(1)
    expect(mocks.track).toHaveBeenCalledWith('onboarding_survey_placement_experiment_exposed', {
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
    expect(mocks.track).not.toHaveBeenCalled()
  })

  // Logged-out requests all get the same arm, so only a signed-in user's own flags count
  it.each<[string, RenderOptions]>([
    ['a logged-out visitor', { isProfileLoaded: false }],
    ['a profile that has not loaded', { signedInUserId: USER_ID, flagsUserId: USER_ID }],
    [
      'flags fetched before sign-in',
      { signedInUserId: USER_ID, flagsUserId: undefined, isProfileLoaded: true },
    ],
    [
      'flags fetched for another user',
      { signedInUserId: USER_ID, flagsUserId: 'user-2', isProfileLoaded: true },
    ],
  ])('returns the arm but records no exposure for %s', (_, options) => {
    const { result } = renderVariantHook('org_form', options)

    expect(result.current.variant).toBe('org_form')
    expect(mocks.track).not.toHaveBeenCalled()
  })
})
