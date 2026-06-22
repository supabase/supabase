import { useEffect } from 'react'
import { getCurrentVersion, parseSchemaComment } from 'stripe-experiment-sync/supabase'

import {
  findStripeSchema,
  isInProgress,
  isInstalled,
  type StripeSyncStatusResult,
} from '@/components/interfaces/Integrations/templates/StripeSyncEngine/stripe-sync-status'
import { useStripeSyncingState } from '@/data/database-integrations/stripe/sync-state-query'
import { Schema, useSchemasQuery } from '@/data/database/schemas-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

// Maximum time allowed for installation or uninstallation operations before the UI times out
const OPERATION_TIME_OUT_MS: number = 5 * 60 * 1000 // 5 minutes

export const getStripeSyncSchemaComment = (schemas: Schema[]) => {
  // Find and parse stripe schema status
  const stripeSchema = findStripeSchema(schemas)
  const rawSchemaComment = parseSchemaComment(stripeSchema?.comment)

  const now = Date.now()
  const timedOut = rawSchemaComment.startTime
    ? now - rawSchemaComment.startTime > OPERATION_TIME_OUT_MS
    : false

  const status = timedOut
    ? rawSchemaComment.status === 'installing'
      ? 'install error'
      : rawSchemaComment.status === 'uninstalling'
        ? 'uninstall error'
        : rawSchemaComment.status
    : rawSchemaComment.status

  const errorMessage = timedOut
    ? rawSchemaComment.status === 'installing'
      ? 'Installation timed out'
      : rawSchemaComment.status === 'uninstalling'
        ? 'Uninstallation timed out'
        : rawSchemaComment.errorMessage
    : rawSchemaComment.errorMessage

  return { ...rawSchemaComment, status, errorMessage, timedOut }
}

/**
 * Unified hook for Stripe Sync installation status.
 *
 * This hook consolidates all schema querying, status parsing, and polling logic
 * into a single source of truth. It returns a discriminated union status that
 * makes impossible states unrepresentable.
 */
export function useStripeSyncStatus(): StripeSyncStatusResult {
  const latestAvailableVersion = getCurrentVersion()
  const { data: project } = useSelectedProjectQuery()
  const { ref: projectRef, connectionString } = project || {}

  // Query schemas once
  const {
    data: schemas,
    isLoading: isSchemasLoading,
    refetch,
  } = useSchemasQuery({ projectRef, connectionString }, { enabled: !!projectRef })

  const schemaComment = getStripeSyncSchemaComment(schemas ?? [])
  const timedOut = schemaComment.timedOut
  const installed = isInstalled(schemaComment.status)
  const inProgress = isInProgress(schemaComment.status)

  // Query sync state only when installed
  const { data: syncState, isPending: isLoadingStripeSyncState } = useStripeSyncingState(
    { projectRef: projectRef!, connectionString },
    {
      refetchInterval: 4000,
      enabled: !!projectRef && installed,
    }
  )

  // Poll schemas during install/uninstall operations
  useEffect(() => {
    // Return if installation/uninstallation is not in progress
    // inProgres is likely to be false during initial render
    if (!inProgress) return

    const interval = setInterval(() => {
      refetch()
    }, 5000)

    return () => clearInterval(interval)
  }, [inProgress, refetch])

  return {
    schemaComment,
    syncState: installed ? syncState : undefined,
    isLoading: isSchemasLoading || isLoadingStripeSyncState,
    latestAvailableVersion,
    timedOut,
  }
}
