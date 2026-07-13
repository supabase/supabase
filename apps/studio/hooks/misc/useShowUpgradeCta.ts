import { IS_PLATFORM } from 'common'

import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

/**
 * Whether to show the "Upgrade to Pro" CTA for the currently selected organization.
 *
 * The CTA only makes sense for free-plan orgs on the hosted platform (self-hosted has no
 * billing to upgrade), so paid orgs and self-hosted never see it. Both CTA placements —
 * the user dropdown and the org project-list usage card — gate on this.
 *
 * `showUpgradeCta` stays false until the org plan is known, so the CTA never flashes for
 * paid users; it simply fades in for free users once the plan resolves.
 */
export const useShowUpgradeCta = () => {
  const { data: organization, isPending } = useSelectedOrganizationQuery()

  const isFreePlan = organization?.plan?.id === 'free'
  const showUpgradeCta = IS_PLATFORM && !isPending && isFreePlan

  return { isFreePlan, showUpgradeCta }
}
