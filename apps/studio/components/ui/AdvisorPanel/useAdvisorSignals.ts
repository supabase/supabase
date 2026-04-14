import { useEffect, useMemo } from 'react'

import { createAdvisorSignalItems } from './AdvisorPanel.utils'
import { useAdvisorSignalDismissals } from './useAdvisorSignalDismissals'
import { useBannedIPsQuery } from '@/data/banned-ips/banned-ips-query'

interface UseAdvisorSignalsOptions {
  projectRef?: string
  enabled?: boolean
}

export const useAdvisorSignals = ({
  projectRef,
  enabled = true,
}: UseAdvisorSignalsOptions = {}) => {
  const bannedIPsQuery = useBannedIPsQuery(
    { projectRef },
    {
      enabled,
    }
  )
  const { dismissSignal, dismissedFingerprintSet, pruneDismissedSignals } =
    useAdvisorSignalDismissals(projectRef)

  const signalItems = useMemo(
    () =>
      createAdvisorSignalItems({
        projectRef,
        bannedIPsData: bannedIPsQuery.data,
      }),
    [projectRef, bannedIPsQuery.data]
  )

  useEffect(() => {
    if (!bannedIPsQuery.data) return

    pruneDismissedSignals(
      signalItems.map((item) => item.fingerprint),
      (fingerprint) => fingerprint.startsWith('signal:banned-ip:')
    )
  }, [bannedIPsQuery.data, pruneDismissedSignals, signalItems])

  const data = useMemo(() => {
    return signalItems.filter((item) => !dismissedFingerprintSet.has(item.fingerprint))
  }, [signalItems, dismissedFingerprintSet])

  return {
    data,
    dismissSignal,
    isPending: bannedIPsQuery.isPending,
    isError: bannedIPsQuery.isError,
  }
}
