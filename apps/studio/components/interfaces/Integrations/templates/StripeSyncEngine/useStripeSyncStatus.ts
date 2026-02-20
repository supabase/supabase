import { useStripeSyncingState } from 'data/database-integrations/stripe/sync-state-query'
import { SchemasVariables, useSchemasQuery } from 'data/database/schemas-query'
import { useEffect } from 'react'

import {
  findStripeSchema,
  isInProgress,
  isInstalled,
  parseStripeSchemaStatus,
  type StripeSyncStatusResult,
} from '@/components/interfaces/Integrations/templates/StripeSyncEngine/stripe-sync-status'

/**
 * Unified hook for Stripe Sync installation status.
 *
 * This hook consolidates all schema querying, status parsing, and polling logic
 * into a single source of truth. It returns a discriminated union status that
 * makes impossible states unrepresentable.
 */
export function useStripeSyncStatus({
  projectRef,
  connectionString,
}: SchemasVariables): StripeSyncStatusResult {
  // Query schemas once
  const {
    data: schemas,
    isLoading: isSchemasLoading,
    refetch,
  } = useSchemasQuery({ projectRef, connectionString }, { enabled: !!projectRef })

  // Find and parse stripe schema status
  const stripeSchema = findStripeSchema(schemas)
  const installationStatus = parseStripeSchemaStatus(stripeSchema)

  const installed = isInstalled(installationStatus)
  const inProgress = isInProgress(installationStatus)

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

  // Query sync state only when installed
  const { data: syncState, isLoading: isSyncStateLoading } = useStripeSyncingState(
    { projectRef: projectRef!, connectionString },
    {
      refetchInterval: 4000,
      enabled: !!projectRef && installed,
    }
  )

  return {
    installationStatus,
    syncState: installed ? syncState : undefined,
    isLoading: isSchemasLoading,
  }
}
