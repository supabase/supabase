import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useTrackExperimentExposure } from '@/hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from '@/hooks/ui/useFlag'

export const UPGRADE_CTA_EXPERIMENT_ID = 'upgradeCtaPlacement'

export type UpgradeCtaPlacement = 'control' | 'user_dropdown' | 'home_usage_card'

/**
 * Shared experiment state for the upgrade CTA placement test.
 *
 * Fires experiment exposure for every free-plan user enrolled in any variant
 * (including control), so the conversion analysis has a baseline cohort.
 *
 * Returns `variant: undefined` when the user is paid, not enrolled, or the
 * flag store hasn't loaded yet — callers should render nothing in that case.
 */
export const useUpgradeCtaExperiment = () => {
  const { data: organization } = useSelectedOrganizationQuery()
  const flagValue = usePHFlag<UpgradeCtaPlacement | false>(UPGRADE_CTA_EXPERIMENT_ID)

  const isFreePlan = organization?.plan?.id === 'free'
  const isInExperiment =
    flagValue === 'control' || flagValue === 'user_dropdown' || flagValue === 'home_usage_card'

  const variant = isFreePlan && isInExperiment ? (flagValue as UpgradeCtaPlacement) : undefined
  useTrackExperimentExposure(UPGRADE_CTA_EXPERIMENT_ID, variant)

  return { isFreePlan, variant }
}
