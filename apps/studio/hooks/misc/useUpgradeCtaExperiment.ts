import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useTrackExperimentExposure } from '@/hooks/misc/useTrackExperimentExposure'
import { usePHFlag } from '@/hooks/ui/useFlag'

// PostHog flag key (camelCase, matches other flag naming in the codebase).
export const UPGRADE_CTA_FLAG_NAME = 'upgradeCtaPlacement'

// snake_case experiment ID so the auto-fired exposure event name matches the
// `[experiment_id]_experiment_exposed` typed event registered in telemetry-constants.ts.
const UPGRADE_CTA_EXPERIMENT_ID = 'upgrade_cta_placement'

export type UpgradeCtaPlacement =
  | 'control'
  | 'user_dropdown'
  | 'home_usage_card'
  | 'org_projects_list'

const VALID_VARIANTS: UpgradeCtaPlacement[] = [
  'control',
  'user_dropdown',
  'home_usage_card',
  'org_projects_list',
]

/**
 * Shared experiment state for the upgrade CTA placement test.
 *
 * The returned `variant` is optimistic during the initial organization query — as soon
 * as the PostHog flag resolves to a valid variant, callers can render skeleton
 * placeholders even before the org plan is known. Once the org query settles, the
 * variant is withdrawn if the user turns out not to be on the free plan, which hides
 * the placeholder cleanly.
 *
 * Exposure tracking only fires once the user is confirmed free-plan + in the
 * experiment, so the experiment cohort stays accurate even though render starts early.
 */
export const useUpgradeCtaExperiment = () => {
  const { data: organization, isPending: isOrgPending } = useSelectedOrganizationQuery()
  const flagValue = usePHFlag<UpgradeCtaPlacement | false>(UPGRADE_CTA_FLAG_NAME)

  const isFreePlan = organization?.plan?.id === 'free'
  const isInExperiment =
    typeof flagValue === 'string' && VALID_VARIANTS.includes(flagValue as UpgradeCtaPlacement)

  // Optimistic during org-pending: render-eligible if the PostHog flag has resolved to a
  // variant. PostHog targets the flag to free-plan users so the false-positive (paid
  // user briefly seeing a skeleton) is a rare edge case.
  const renderEligible = isInExperiment && (isOrgPending || isFreePlan)
  const variant = renderEligible ? (flagValue as UpgradeCtaPlacement) : undefined

  // Exposure fires only once we have confirmation the user is actually on the free plan.
  const confirmedVariant =
    isFreePlan && isInExperiment ? (flagValue as UpgradeCtaPlacement) : undefined
  useTrackExperimentExposure(UPGRADE_CTA_EXPERIMENT_ID, confirmedVariant)

  return { isFreePlan, variant }
}
