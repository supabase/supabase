import { maybeShowUpgradePromptIfNotEntitled } from 'components/interfaces/Settings/Logs/Logs.utils'
import { useEffect, useState } from 'react'
import { useCheckEntitlements } from './useCheckEntitlements'

export const useUpgradePrompt = (from: string) => {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const { getEntitlementNumericValue } = useCheckEntitlements('log.retention_days')
  const entitledToAuditLogDays = getEntitlementNumericValue()

  const shouldShowUpgradePrompt = maybeShowUpgradePromptIfNotEntitled(from, entitledToAuditLogDays)

  useEffect(() => {
    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(true)
    }
  }, [from])

  return { showUpgradePrompt, setShowUpgradePrompt, shouldShowUpgradePrompt }
}
