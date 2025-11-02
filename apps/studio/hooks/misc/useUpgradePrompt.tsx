import { maybeShowUpgradePrompt } from 'components/interfaces/Settings/Logs/Logs.utils'
import { useEffect, useState } from 'react'
import { useSelectedOrganizationQuery } from './useSelectedOrganization'

export const useUpgradePrompt = (from: string) => {
  const { data: organization } = useSelectedOrganizationQuery()
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

  const shouldShowUpgradePrompt = maybeShowUpgradePrompt(from, organization?.plan?.id)

  useEffect(() => {
    if (shouldShowUpgradePrompt) {
      setShowUpgradePrompt(true)
    }
  }, [from])

  return { showUpgradePrompt, setShowUpgradePrompt, shouldShowUpgradePrompt }
}
