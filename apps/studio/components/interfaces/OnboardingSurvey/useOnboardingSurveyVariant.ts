import { useFeatureFlags, useUser } from 'common'
import { useEffect, useRef } from 'react'

import {
  isOnboardingSurveyVariant,
  ONBOARDING_SURVEY_EXPERIMENT_ID,
} from './OnboardingSurvey.constants'
import { usePHFlag } from '@/hooks/ui/useFlag'
import { useProfile } from '@/lib/profile'
import { useTrack } from '@/lib/telemetry/track'

const EXPOSURE_EXPERIMENT_ID = 'onboarding_survey_placement'

/**
 * Reads the user's onboardingSurveyPlacement arm and records exposure for it.
 * Flag values outside ONBOARDING_SURVEY_VARIANTS resolve to undefined, so the
 * user gets the default form and no exposure is recorded.
 */
export function useOnboardingSurveyVariant() {
  const flagValue = usePHFlag<string | false>(ONBOARDING_SURVEY_EXPERIMENT_ID)
  const variant = isOnboardingSurveyVariant(flagValue) ? flagValue : undefined

  const track = useTrack()
  const user = useUser()
  const { isSuccess: isProfileLoaded } = useProfile()
  const { userId: flagsUserId } = useFeatureFlags()
  // Logged-out requests all get the same flag value, and it stays in the store after
  // sign-in until the refetch lands.
  const areFlagsForUser = !!user?.id && flagsUserId === user.id

  const hasTrackedExposure = useRef(false)
  useEffect(() => {
    if (hasTrackedExposure.current) return
    if (!variant || !isProfileLoaded || !areFlagsForUser) return
    hasTrackedExposure.current = true
    track('onboarding_survey_placement_experiment_exposed', {
      experiment_id: EXPOSURE_EXPERIMENT_ID,
      variant,
    })
  }, [variant, isProfileLoaded, areFlagsForUser, track])

  return { variant }
}
