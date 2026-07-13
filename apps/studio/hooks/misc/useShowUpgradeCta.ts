import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * Whether to show the "Upgrade to Pro" CTA for the currently selected organization.
 *
 * The CTA only makes sense for free-plan orgs on the hosted platform (self-hosted has no
 * billing to upgrade), so paid orgs and self-hosted never see it. Both CTA placements —
 * the user dropdown and the org project-list usage card — gate on this.
 *
 * `showUpgradeCta` stays false until the org plan is known, so the CTA never flashes for
 * paid users; it simply fades in for free users once the plan resolves.
 *
 * Pass `enabled: false` from callers mounted where the CTA can never render (e.g. the
 * globally-mounted user dropdown on non-org routes) to skip fetching organization data.
 */
export const useShowUpgradeCta = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const shouldEvaluate = IS_PLATFORM && enabled
  const { data: organization, isPending } = useSelectedOrganizationQuery({
    enabled: shouldEvaluate,
  })

  const isFreePlan = organization?.plan?.id === 'free'
  const showUpgradeCta = shouldEvaluate && !isPending && isFreePlan

  return { isFreePlan, showUpgradeCta }
}
