import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useEffect, useMemo, useRef } from 'react'

import { usePHFlag } from 'hooks/ui/useFlag'
import { NEW_PROJECT_THRESHOLD_DAYS } from 'lib/constants'
import { useTrack } from 'lib/telemetry/track'
import { RealtimeButtonVariant } from 'types'

dayjs.extend(utc)

interface UseRealtimeExperimentOptions {
  /**
   * Project creation timestamp
   */
  projectInsertedAt?: string
  /**
   * Whether the current context is a table (not a view/foreign table)
   */
  isTable?: boolean
  /**
   * Whether realtime is currently enabled for the table
   */
  isRealtimeEnabled?: boolean
}

interface UseRealtimeExperimentResult {
  /**
   * The active variant for this user/project, or null if not in experiment
   */
  activeVariant: RealtimeButtonVariant | null
  /**
   * Whether this project is considered "new" for experiment targeting
   */
  isNewProject: boolean
}

/**
 * Hook to manage the realtime button A/B experiment logic.
 * Handles variant determination, exposure tracking, and date validation.
 *
 * @param options Configuration for experiment targeting
 * @returns Experiment state including active variant and project age
 */
export function useRealtimeExperiment({
  projectInsertedAt,
  isTable = false,
  isRealtimeEnabled = false,
}: UseRealtimeExperimentOptions): UseRealtimeExperimentResult {
  const track = useTrack()
  const realtimeButtonVariant = usePHFlag<RealtimeButtonVariant | false | undefined>(
    'realtimeButtonVariant'
  )
  const hasTrackedExposure = useRef(false)

  const isNewProject = useMemo(() => {
    if (!projectInsertedAt) return false

    // Validate date format
    const insertedDate = dayjs.utc(projectInsertedAt)
    if (!insertedDate.isValid()) {
      console.warn('[useRealtimeExperiment] Invalid project inserted_at date:', projectInsertedAt)
      return false
    }

    return dayjs.utc().diff(insertedDate, 'day') < NEW_PROJECT_THRESHOLD_DAYS
  }, [projectInsertedAt])

  const activeVariant = useMemo(() => {
    if (!isTable || !isNewProject) return null
    if (!realtimeButtonVariant || realtimeButtonVariant === RealtimeButtonVariant.CONTROL) {
      return null
    }
    return realtimeButtonVariant
  }, [isTable, isNewProject, realtimeButtonVariant])

  // Track exposure once per component lifecycle
  useEffect(() => {
    // Guard clause: skip if already tracked or conditions not met
    if (hasTrackedExposure.current) return
    if (!isTable || !isNewProject || !projectInsertedAt) return
    if (realtimeButtonVariant === false || realtimeButtonVariant === undefined) return

    // Mark as tracked BEFORE async operation to prevent race condition
    hasTrackedExposure.current = true

    try {
      const insertedDate = dayjs.utc(projectInsertedAt)
      if (!insertedDate.isValid()) return

      const daysSinceCreation = dayjs.utc().diff(insertedDate, 'day')

      track('realtime_experiment_exposed', {
        variant: realtimeButtonVariant,
        table_has_realtime_enabled: isRealtimeEnabled,
        days_since_project_creation: daysSinceCreation,
      })
    } catch (error) {
      console.error('[useRealtimeExperiment] Failed to track exposure:', error)
      // Reset flag on error so we can retry
      hasTrackedExposure.current = false
    }
  }, [isTable, isNewProject, realtimeButtonVariant, projectInsertedAt, isRealtimeEnabled, track])

  return {
    activeVariant,
    isNewProject,
  }
}
