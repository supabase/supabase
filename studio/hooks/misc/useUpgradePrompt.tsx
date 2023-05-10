import { useEffect, useState } from 'react'
import { useParams } from 'common/hooks'
import { maybeShowUpgradePrompt } from 'components/interfaces/Settings/Logs'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'

export const useUpgradePrompt = (from: string) => {
  const { ref: projectRef } = useParams()
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef })
  const tier = subscription?.tier
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const shouldShowUpgradePrompt = maybeShowUpgradePrompt(from, tier?.key)

  useEffect(() => {
    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(true)
    }
  }, [from])

  return { showUpgradePrompt, setShowUpgradePrompt, shouldShowUpgradePrompt }
}
