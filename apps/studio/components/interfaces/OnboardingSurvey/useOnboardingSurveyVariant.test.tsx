import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useOnboardingSurveyVariant } from './useOnboardingSurveyVariant'

const { flagState, mockTrackExperimentExposure } = vi.hoisted(() => ({
  flagState: { current: undefined as string | boolean | undefined },
  mockTrackExperimentExposure: vi.fn(),
}))

vi.mock('@/hooks/ui/useFlag', () => ({
  usePHFlag: () => flagState.current,
}))

vi.mock('@/hooks/misc/useTrackExperimentExposure', () => ({
  useTrackExperimentExposure: mockTrackExperimentExposure,
}))

describe('useOnboardingSurveyVariant', () => {
  beforeEach(() => {
    mockTrackExperimentExposure.mockClear()
  })

  it.each(['control', 'org_form'])('returns and tracks the %s arm', (arm) => {
    flagState.current = arm

    const { result } = renderHook(() => useOnboardingSurveyVariant())

    expect(result.current.variant).toBe(arm)
    expect(mockTrackExperimentExposure).toHaveBeenCalledWith('onboarding_survey_placement', arm)
  })

  it.each(['org_form_collapsed', 'org_form_expanded', 'dialog', 'toast', false, undefined])(
    'treats %s as no survey and records no exposure',
    (value) => {
      flagState.current = value

      const { result } = renderHook(() => useOnboardingSurveyVariant())

      expect(result.current.variant).toBeUndefined()
      expect(mockTrackExperimentExposure).toHaveBeenCalledWith(
        'onboarding_survey_placement',
        undefined
      )
    }
  )
})
