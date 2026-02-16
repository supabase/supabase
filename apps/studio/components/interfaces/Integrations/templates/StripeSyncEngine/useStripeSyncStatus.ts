import { useStripeSyncingState } from 'data/database-integrations/stripe/sync-state-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useMemo } from 'react'

import type { StripeSyncStatusResult } from '@/components/interfaces/Integrations/templates/StripeSyncEngine/stripe-sync'
import {
  findStripeSchema,
  isInProgress,
  isInstalled,
  parseStripeSchemaStatus,
} from '@/components/interfaces/Integrations/templates/StripeSyncEngine/stripe-sync-status'

interface UseStripeSyncStatusOptions {
  projectRef: string | undefined
  connectionString: string | undefined | null
}

/**
 * Unified hook for Stripe Sync installation status.
 *
 * This hook consolidates all schema querying, status parsing, and polling logic
 * into a single source of truth. It returns a discriminated union status that
 * makes impossible states unrepresentable.
 *
 * Features:
 * - Automatic polling during install/uninstall operations (5s interval)
 * - Sync state polling when installed (4s interval)
 * - Single status discriminated union instead of multiple boolean flags
 * - Derived sync state
 */
export function useStripeSyncStatus({
  projectRef,
  connectionString,
}: UseStripeSyncStatusOptions): StripeSyncStatusResult {
  // Query schemas with conditional polling during transitions
  const { data: schemas, isLoading: isSchemasLoading } = useSchemasQuery(
    { projectRef, connectionString },
    {
      enabled: !!projectRef,
    }
  )

  // Find and parse stripe schema status
  const stripeSchema = findStripeSchema(schemas)
  const installationStatus = useMemo(() => parseStripeSchemaStatus(stripeSchema), [stripeSchema])

  const installed = isInstalled(installationStatus)
  const inProgress = isInProgress(installationStatus)

  // Poll schemas during install/uninstall operations
  useSchemasQuery(
    { projectRef, connectionString },
    {
      refetchInterval: inProgress ? 5000 : false,
      enabled: !!projectRef && inProgress,
    }
  )

  // Query sync state only when installed
  const { data: syncState, isLoading: isSyncStateLoading } = useStripeSyncingState(
    { projectRef: projectRef!, connectionString },
    {
      refetchInterval: 4000,
      enabled: !!projectRef && installed,
    }
  )

  // Determine if a sync is currently running
  const isSyncing = useMemo(() => {
    return !!syncState && !syncState.closed_at && syncState.status === 'running'
  }, [syncState])

  return {
    installationStatus,
    stripeSchema,
    syncState: installed ? syncState : undefined,
    isSyncing,
    isLoading: isSchemasLoading || (installed && isSyncStateLoading),
    isPolling: inProgress,
  }
}
