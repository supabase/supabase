import type { StripeSyncState } from 'data/database-integrations/stripe/sync-state-query'
import type { Schema } from 'data/database/schemas-query'

/**
 * All possible Stripe Sync installation states.
 */
export type StripeInstallationStatus =
  | 'installing'
  | 'installed'
  | 'install_error'
  | 'uninstalling'
  | 'uninstalled'
  | 'uninstall_error'

/**
 * Complete Stripe Sync status including schema, installation state, and sync state
 */
export interface StripeSyncStatusResult {
  /** The installation status */
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
