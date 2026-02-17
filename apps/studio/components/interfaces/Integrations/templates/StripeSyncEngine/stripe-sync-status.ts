import type {
  StripeSyncState,
  StripeSyncStateData,
} from 'data/database-integrations/stripe/sync-state-query'
import type { Schema } from 'data/database/schemas-query'
import {
  INSTALLATION_ERROR_SUFFIX,
  INSTALLATION_INSTALLED_SUFFIX,
  INSTALLATION_STARTED_SUFFIX,
  STRIPE_SCHEMA_COMMENT_PREFIX,
} from 'stripe-experiment-sync/supabase'

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

  /** Whether the status is still being determined (schemas query is loading) */
  isLoading: boolean
}

// TODO: The current version of the package 'stripe-experiment-sync' doesn't export
// these constants, but we plan to export them in future version. For now we
// declare the same constants here to deploy this code without waiting for
// a new version. We'll import them when we bump 'stripe-experiment-sync' package
// version.
const UNINSTALLATION_STARTED_SUFFIX = 'uninstallation:started'
const UNINSTALLATION_ERROR_SUFFIX = 'uninstallation:error'

export function findStripeSchema(schemas: Schema[] | undefined): Schema | undefined {
  return schemas?.find((s) => s.name === 'stripe')
}

function isStripeSyncSchema(schema: Schema | undefined): boolean {
  return !!schema?.comment?.startsWith(STRIPE_SCHEMA_COMMENT_PREFIX)
}

function hasStatusSuffix(schema: Schema | undefined, suffix: string): boolean {
  return isStripeSyncSchema(schema) && !!schema?.comment?.endsWith(suffix)
}

/**
 * Parse the installation status from a stripe schema.
 *
 * @param stripeSchema - The stripe schema from the database, if it exists
 * @returns The installation status
 */
export function parseStripeSchemaStatus(
  stripeSchema: Schema | undefined
): StripeInstallationStatus {
  if (hasStatusSuffix(stripeSchema, UNINSTALLATION_ERROR_SUFFIX)) {
    return 'uninstall_error'
  }

  if (hasStatusSuffix(stripeSchema, INSTALLATION_ERROR_SUFFIX)) {
    return 'install_error'
  }

  if (hasStatusSuffix(stripeSchema, UNINSTALLATION_STARTED_SUFFIX)) {
    return 'uninstalling'
  }

  if (hasStatusSuffix(stripeSchema, INSTALLATION_STARTED_SUFFIX)) {
    return 'installing'
  }

  if (hasStatusSuffix(stripeSchema, INSTALLATION_INSTALLED_SUFFIX)) {
    return 'installed'
  }

  return 'uninstalled'
}

export function isInstalled(status: StripeInstallationStatus): boolean {
  return status === 'installed'
}

export function isUninstalled(status: StripeInstallationStatus): boolean {
  return status === 'uninstalled'
}

export function hasInstallError(status: StripeInstallationStatus): boolean {
  return status === 'install_error'
}

export function hasUninstallError(status: StripeInstallationStatus): boolean {
  return status === 'uninstall_error'
}

export function hasError(status: StripeInstallationStatus): boolean {
  return hasInstallError(status) || hasUninstallError(status)
}

export function isInstalling(status: StripeInstallationStatus): boolean {
  return status === 'installing'
}

export function isUninstalling(status: StripeInstallationStatus): boolean {
  return status === 'uninstalling'
}

export function isInProgress(status: StripeInstallationStatus): boolean {
  return isInstalling(status) || isUninstalling(status)
}

export function isInstallDone(status: StripeInstallationStatus): boolean {
  return isInstalled(status) || hasInstallError(status)
}

export function isUninstallDone(status: StripeInstallationStatus): boolean {
  return isUninstalled(status) || hasUninstallError(status)
}

export function canInstall(status: StripeInstallationStatus): boolean {
  return isUninstalled(status) || hasError(status)
}

export function isSyncRunning(syncState: StripeSyncStateData | undefined): boolean {
  return !!syncState && !syncState.closed_at && syncState.status === 'running'
}
