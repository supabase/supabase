import { useState } from 'react'

import { customDateRangeToLogTimeRange } from './LogTimeRange.utils'
import { maybeShowUpgradePromptIfNotEntitled } from '@/components/interfaces/Settings/Logs/Logs.utils'
import type { LogTimeRange } from '@/data/query-sources/query-source-registry'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'

export function useLogsCustomRange({
  onRangeChange,
}: {
  onRangeChange: (range: LogTimeRange) => void
}) {
  const [isCustomRangeOpen, setIsCustomRangeOpen] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const { getEntitlementNumericValue } = useCheckEntitlements('log.retention_days')
  const entitledToLogDays = getEntitlementNumericValue()

  const handleApplyCustomRange = ({ from, to }: { from: Date; to: Date }) => {
    const range = customDateRangeToLogTimeRange({ from, to })
    if (maybeShowUpgradePromptIfNotEntitled(range.from, entitledToLogDays)) {
      setShowUpgradePrompt(true)
      return
    }

    onRangeChange(range)
  }

  return {
    isCustomRangeOpen,
    setIsCustomRangeOpen,
    showUpgradePrompt,
    setShowUpgradePrompt,
    handleApplyCustomRange,
  }
}
