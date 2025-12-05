import { maybeShowUpgradePromptIfNotEntitled } from 'components/interfaces/Settings/Logs/Logs.utils'
import { useEffect, useState } from 'react'
import { useCheckEntitlements } from './useCheckEntitlements'
import { Feature } from 'data/entitlements/entitlements.constants'

export const useUpgradePrompt = (from: string) => {
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const { getEntitlementNumericValue } = useCheckEntitlements(Feature.LOG_RETENTION_DAYS)
  const entitledToAuditLogDays = getEntitlementNumericValue()

  const shouldShowUpgradePrompt = maybeShowUpgradePromptIfNotEntitled(from, entitledToAuditLogDays)

  useEffect(() => {
    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(true)
    }
  }, [from])

  return { showUpgradePrompt, setShowUpgradePrompt, shouldShowUpgradePrompt }
}
