import type { Schema } from 'data/database/schemas-query'
import type { StripeSyncState } from 'data/database-integrations/stripe/sync-state-query'

/**
 * Discriminated union representing all possible Stripe Sync installation states.
 * This makes impossible states unrepresentable - e.g., you can't be both
 * "installed" and "installing" at the same time.
 */
export type StripeInstallationStatus =
  | { status: 'not_installed'; hasConflictingSchema: false }
  | { status: 'conflicting_schema'; hasConflictingSchema: true }
  | { status: 'installing'; hasConflictingSchema: false }
  | { status: 'installed'; hasConflictingSchema: false }
  | { status: 'install_error'; hasConflictingSchema: false }
  | { status: 'uninstalling'; hasConflictingSchema: false }
  | { status: 'uninstall_error'; hasConflictingSchema: false }

/**
 * Simple status string for cases where we just need to check the state
 */
export type StripeInstallationStatusType = StripeInstallationStatus['status']

/**
 * Complete Stripe Sync status including schema, installation state, and sync state
 */
export interface StripeSyncStatusResult {
  /** The discriminated union status */
  installationStatus: StripeInstallationStatus
  /** The stripe schema if it exists */
  stripeSchema: Schema | undefined
  /** Current sync run state (only available when installed) */
  syncState: StripeSyncState | undefined
  /** Whether a sync is currently running */
  isSyncing: boolean
  /** Whether data is still loading */
  isLoading: boolean
  /** Whether polling is active */
  isPolling: boolean
}

// Re-export for convenience
export type { StripeSyncState }
