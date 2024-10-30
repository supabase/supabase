import { maybeShowUpgradePrompt } from 'components/interfaces/Settings/Logs/Logs.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useEffect, useState } from 'react'
import { useSelectedOrganization } from './useSelectedOrganization'

export const useUpgradePrompt = (from: string) => {
  const organization = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const shouldShowUpgradePrompt = maybeShowUpgradePrompt(from, subscription?.plan?.id)

  useEffect(() => {
    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(true)
    }
  }, [from])

  return { showUpgradePrompt, setShowUpgradePrompt, shouldShowUpgradePrompt }
}
