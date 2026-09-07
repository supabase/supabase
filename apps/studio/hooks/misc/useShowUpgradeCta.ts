import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * Whether to show the "Upgrade to Pro" CTA (free-plan orgs on the hosted platform only).
 * Pass `enabled: false` where the CTA can't render to skip fetching organization data.
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
