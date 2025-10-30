import { maybeShowUpgradePrompt } from 'components/interfaces/Settings/Logs/Logs.utils'
import { useEffect, useState } from 'react'
import { useSelectedOrganizationQuery } from './useSelectedOrganization'
import { useCheckEntitlements } from './useCheckEntitlements'

export const useUpgradePrompt = (from: string) => {
  // This is the one on Time Range in ./logs
  const { getEntitlementNumericValue } = useCheckEntitlements('security.audit_logs_days')
  const entitledToAuditLogDays = getEntitlementNumericValue()
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const shouldShowUpgradePrompt = maybeShowUpgradePrompt(from, entitledToAuditLogDays)

  useEffect(() => {
    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(true)
    }
  }, [from])

  return { showUpgradePrompt, setShowUpgradePrompt, shouldShowUpgradePrompt }
}
