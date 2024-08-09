import { useCallback } from 'react'

import { subscriptionHasHipaaAddon } from 'components/interfaces/Billing/Subscription/Subscription.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

export function useDisallowHipaa() {
  const selectedOrganization = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: selectedOrganization?.slug })
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription)

  const disallowHipaa = useCallback(
    (allowed: boolean) => {
      return hasHipaaAddon ? false : allowed
    },
    [hasHipaaAddon]
  )

  return disallowHipaa
}
