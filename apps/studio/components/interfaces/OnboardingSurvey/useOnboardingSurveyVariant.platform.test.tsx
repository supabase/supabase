import { renderHook } from '@testing-library/react'
import { FeatureFlagContext, posthogClient } from 'common'
import type { PropsWithChildren } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useOnboardingSurveyVariant } from './useOnboardingSurveyVariant'
import { CustomWrapper } from '@/tests/lib/custom-render'

const renderVariantHook = (flagValue: string | boolean | undefined) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <FeatureFlagContext.Provider
      value={{
        configcat: {},
        // An empty store reads as "flags not loaded yet"
        posthog: flagValue === undefined ? {} : { onboardingSurveyPlacement: flagValue },
        hasLoaded: true,
      }}
    >
      <CustomWrapper>{children}</CustomWrapper>
    </FeatureFlagContext.Provider>
  )
  return renderHook(() => useOnboardingSurveyVariant(), { wrapper })
}

describe('useOnboardingSurveyVariant', () => {
  const captureExposure = vi.spyOn(posthogClient, 'captureExperimentExposure')

  beforeEach(() => {
    captureExposure.mockReset()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it.each(['control', 'org_form'])('records exposure for the %s arm', (arm) => {
    const { result } = renderVariantHook(arm)

    expect(result.current.variant).toBe(arm)
    expect(captureExposure).toHaveBeenCalledTimes(1)
    expect(captureExposure).toHaveBeenCalledWith(
      'onboarding_survey_placement',
      { variant: arm },
      expect.anything()
    )
  })

  // A flag value from an arm this build doesn't know must not put the user in the experiment
  it.each([
    ['an unknown arm', 'org_form_v2'],
    ['a user the flag has not assigned', false],
    ['flags that have not loaded', undefined],
  ])('gives the default form and records no exposure for %s', (_, flagValue) => {
    const { result } = renderVariantHook(flagValue)

    expect(result.current.variant).toBeUndefined()
    expect(captureExposure).not.toHaveBeenCalled()
  })
})
