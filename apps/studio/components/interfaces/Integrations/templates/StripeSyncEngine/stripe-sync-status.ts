import type {
  StripeSyncState,
  StripeSyncStateData,
} from 'data/database-integrations/stripe/sync-state-query'
import type { Schema } from 'data/database/schemas-query'
import {
  SchemaInstallationStatus,
  STRIPE_SCHEMA_COMMENT_PREFIX,
  StripeSchemaComment,
} from 'stripe-experiment-sync/supabase'

/**
 * Complete Stripe Sync status including schema, installation state, and sync state
 */
export interface StripeSyncStatusResult {
  /** The parsed schema with status, version and error */
  schemaComment: StripeSchemaComment

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

export function isInstalled(status: SchemaInstallationStatus): boolean {
  return status === 'installed'
}

export function isUninstalled(status: SchemaInstallationStatus): boolean {
  return status === 'uninstalled'
}

export function hasInstallError(status: SchemaInstallationStatus): boolean {
  return status === 'install_error'
}

export function hasUninstallError(status: SchemaInstallationStatus): boolean {
  return status === 'uninstall_error'
}

export function hasError(status: SchemaInstallationStatus): boolean {
  return hasInstallError(status) || hasUninstallError(status)
}

export function isInstalling(status: SchemaInstallationStatus): boolean {
  return status === 'installing'
}

export function isUninstalling(status: SchemaInstallationStatus): boolean {
  return status === 'uninstalling'
}

export function isInProgress(status: SchemaInstallationStatus): boolean {
  return isInstalling(status) || isUninstalling(status)
}

export function isInstallDone(status: SchemaInstallationStatus): boolean {
  return isInstalled(status) || hasInstallError(status)
}

export function isUninstallDone(status: SchemaInstallationStatus): boolean {
  return isUninstalled(status) || hasUninstallError(status)
}

export function canInstall(status: SchemaInstallationStatus): boolean {
  return isUninstalled(status) || hasError(status)
}

export function isSyncRunning(syncState: StripeSyncStateData | undefined): boolean {
  return !!syncState && !syncState.closed_at && syncState.status === 'running'
}
