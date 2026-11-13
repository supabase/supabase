import { useFeatureFlags } from 'common'
import { useEffect, useRef } from 'react'

import {
  isOnboardingSurveyVariant,
  ONBOARDING_SURVEY_EXPERIMENT_ID,
} from './OnboardingSurvey.constants'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { useTrack } from '@/lib/telemetry/track'

const EXPOSURE_EXPERIMENT_ID = 'onboarding_survey_placement'

/**
 * Reads the user's onboardingSurveyPlacement arm and records exposure for it once
 * the form counts as exposed.
 * Flag values outside ONBOARDING_SURVEY_VARIANTS, and flags that were not fetched
 * for the signed-in user, resolve to undefined, so the user gets the default form
 * and no exposure is recorded.
 */
export function useOnboardingSurveyVariant({ isFormExposed }: { isFormExposed: boolean }) {
  const flagValue = usePHFlag<string | false>(ONBOARDING_SURVEY_EXPERIMENT_ID)
  const { hasFlagsForSignedInUser } = useFeatureFlags()
  const variant =
    hasFlagsForSignedInUser && isOnboardingSurveyVariant(flagValue) ? flagValue : undefined

  const track = useTrack()
  const hasTrackedExposure = useRef(false)
  useEffect(() => {
    if (hasTrackedExposure.current) return
    if (!variant || !isFormExposed) return
    hasTrackedExposure.current = true
    track('onboarding_survey_placement_experiment_exposed', {
      experiment_id: EXPOSURE_EXPERIMENT_ID,
      variant,
    })
  }, [variant, isFormExposed, track])

  return { variant }
}
