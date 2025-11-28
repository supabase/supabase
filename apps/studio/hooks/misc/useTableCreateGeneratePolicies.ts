import { useEffect, useMemo, useRef } from 'react'

import { usePHFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'

interface UseTableCreateGeneratePoliciesOptions {
  /**
   * Whether this is a new table being created
   */
  isNewRecord?: boolean
}

interface UseTableCreateGeneratePoliciesResult {
  /**
   * Whether the generate policies feature is enabled
   */
  enabled: boolean
}

/**
 * Hook to manage the table create generate policies feature flag.
 * Handles feature flag determination and exposure tracking.
 *
 * @param options Configuration for feature targeting
 * @returns Feature state including whether it's enabled
 */
export function useTableCreateGeneratePolicies({
  isNewRecord = false,
}: UseTableCreateGeneratePoliciesOptions): UseTableCreateGeneratePoliciesResult {
  const track = useTrack()
  const tableCreateGeneratePoliciesFlag = usePHFlag<boolean>('tableCreateGeneratePolicies')
  const hasTrackedExposure = useRef(false)

  const enabled = useMemo(() => {
    if (!IS_PLATFORM) return false
    if (!tableCreateGeneratePoliciesFlag) return false
    return true
  }, [tableCreateGeneratePoliciesFlag])

  useEffect(() => {
    if (!IS_PLATFORM) return
    if (hasTrackedExposure.current) return
    if (!isNewRecord) return
    if (tableCreateGeneratePoliciesFlag === undefined) return

    hasTrackedExposure.current = true

    try {
      track('table_create_generate_policies_exposed', {
        enabled: tableCreateGeneratePoliciesFlag,
      })
    } catch {
      hasTrackedExposure.current = false
    }
  }, [isNewRecord, tableCreateGeneratePoliciesFlag, track])

  return {
    enabled,
  }
}

