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

  /** Current sync run state (only available when installationStatus is installed) */
  syncState: StripeSyncState | undefined
}
