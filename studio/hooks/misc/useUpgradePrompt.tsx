import { useEffect, useState } from 'react'
import { useParams } from 'common/hooks'
import { maybeShowUpgradePrompt } from 'components/interfaces/Settings/Logs'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'

export const useUpgradePrompt = (from: string) => {
  const { ref: projectRef } = useParams()
  const { data: subscription } = useProjectSubscriptionV2Query({ projectRef })
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const shouldShowUpgradePrompt = maybeShowUpgradePrompt(from, subscription?.plan?.id)

  useEffect(() => {
    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(true)
    }
  }, [from])

  return { showUpgradePrompt, setShowUpgradePrompt, shouldShowUpgradePrompt }
}
