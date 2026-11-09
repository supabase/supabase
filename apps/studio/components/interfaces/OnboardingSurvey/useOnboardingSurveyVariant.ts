import {
  isOnboardingSurveyVariant,
  ONBOARDING_SURVEY_EXPERIMENT_ID,
} from './OnboardingSurvey.constants'
import { useTrackExperimentExposure } from '@/hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from '@/hooks/ui/useFlag'

const EXPOSURE_EXPERIMENT_ID = 'onboarding_survey_placement'

/**
 * Reads the user's onboardingSurveyPlacement arm and records exposure for it.
 * Flag values outside ONBOARDING_SURVEY_VARIANTS resolve to undefined, so the
 * user gets the default form and no exposure is recorded.
 */
export function useOnboardingSurveyVariant() {
  const flagValue = usePHFlag<string | false>(ONBOARDING_SURVEY_EXPERIMENT_ID)
  const variant = isOnboardingSurveyVariant(flagValue) ? flagValue : undefined

  useTrackExperimentExposure(EXPOSURE_EXPERIMENT_ID, variant)

  return { variant }
}
