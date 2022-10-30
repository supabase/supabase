import { useEffect, useState } from 'react'
import { useProjectSubscription } from 'hooks'
import { useRouter } from 'next/router'
import { maybeShowUpgradePrompt } from 'components/interfaces/Settings/Logs'
import { StripeProduct } from 'components/interfaces/Billing'

export const useUpgradePrompt = (from: string) => {
  const router = useRouter()
  const { ref } = router.query
  const { subscription } = useProjectSubscription(ref as string)
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
