import { useCallback, useMemo } from 'react'

import { createAdvisorSignalDismissalStorageKey } from './AdvisorPanel.utils'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

export const useAdvisorSignalDismissals = (projectRef?: string) => {
  const storageKey = projectRef
    ? createAdvisorSignalDismissalStorageKey(projectRef)
    : 'advisor-signal-dismissals:unknown-project'

  const [dismissedFingerprints, setDismissedFingerprints] = useLocalStorageQuery<string[]>(
    storageKey,
    []
  )

  const dismissedFingerprintSet = useMemo(
    () => new Set(dismissedFingerprints),
    [dismissedFingerprints]
  )

  const dismissSignal = useCallback(
    (fingerprint: string) => {
      setDismissedFingerprints((currentDismissals) =>
        currentDismissals.includes(fingerprint)
          ? currentDismissals
          : [...currentDismissals, fingerprint]
      )
    },
    [setDismissedFingerprints]
  )

  const pruneDismissedSignals = useCallback(
    (
      activeFingerprints: string[],
      shouldPruneFingerprint: (fingerprint: string) => boolean = () => true
    ) => {
      const activeFingerprintSet = new Set(activeFingerprints)

      setDismissedFingerprints((currentDismissals) => {
        const nextDismissals = currentDismissals.filter((fingerprint) =>
          shouldPruneFingerprint(fingerprint) ? activeFingerprintSet.has(fingerprint) : true
        )

        return nextDismissals.length === currentDismissals.length
          ? currentDismissals
          : nextDismissals
      })
    },
    [setDismissedFingerprints]
  )

  return {
    dismissedFingerprints,
    dismissedFingerprintSet,
    dismissSignal,
    pruneDismissedSignals,
  }
}
