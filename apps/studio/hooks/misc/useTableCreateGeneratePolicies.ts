import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useEffect, useMemo, useRef } from 'react'

import { usePHFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'

dayjs.extend(utc)

interface UseTableCreateGeneratePoliciesOptions {
  /**
   * Whether this is a new table being created
   */
  isNewRecord?: boolean
  /**
   * Project creation timestamp
   */
  projectInsertedAt?: string
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
  projectInsertedAt,
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
    if (!projectInsertedAt) return

    try {
      const insertedDate = dayjs.utc(projectInsertedAt)
      if (!insertedDate.isValid()) return

      const daysSinceCreation = dayjs.utc().diff(insertedDate, 'day')
      track('table_create_generate_policies_experiment_exposed', {
        experiment_id: 'tableCreateGeneratePolicies',
        variant: tableCreateGeneratePoliciesFlag ? 'treatment' : 'control',
        days_since_project_creation: daysSinceCreation,
      })
      hasTrackedExposure.current = true
    } catch {
      hasTrackedExposure.current = false
    }
  }, [isNewRecord, tableCreateGeneratePoliciesFlag, projectInsertedAt, track])

  return {
    enabled,
  }
}
