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
 * Parsed Stripe schema status including version and error message
 */
export interface ParsedStripeSchema {
  /** The installation status */
  status: StripeInstallationStatus

  /** The version from the schema comment (e.g., 'v1.2.3') */
  version?: string

  /** Error message if status is install_error or uninstall_error */
  errorMessage?: string
}

/**
 * Complete Stripe Sync status including schema, installation state, and sync state
 */
export interface StripeSyncStatusResult {
  /** The parsed schema with status, version and error */
  parsedSchema: ParsedStripeSchema

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

/**
 * Parse the installation status from a stripe schema.
 *
 * Schema comment format: {PREFIX} {version} {SUFFIX}[ - {error message}]
 * Example: "stripe_sync v1.2.3 installation:error - Could not apply migration"
 *
 * @param stripeSchema - The stripe schema from the database, if it exists
 * @returns The parsed status including version and optional error message
 */
export function parseStripeSchema(stripeSchema: Schema | undefined): ParsedStripeSchema {
  if (!isStripeSyncSchema(stripeSchema)) {
    return { status: 'uninstalled' }
  }

  const comment = stripeSchema!.comment!

  // Remove prefix and leading space
  const afterPrefix = comment.slice(STRIPE_SCHEMA_COMMENT_PREFIX.length).trimStart()

  // Split at first space to get version and trailing segment
  const firstSpaceIndex = afterPrefix.indexOf(' ')
  if (firstSpaceIndex === -1) {
    return { status: 'uninstalled' }
  }

  const version = afterPrefix.slice(0, firstSpaceIndex)
  const trailing = afterPrefix.slice(firstSpaceIndex + 1)

  // Helper to extract error message if present after ' - ' separator
  const extractError = (afterSuffix: string): string | undefined => {
    if (afterSuffix.startsWith(' - ')) {
      return afterSuffix.slice(3) // Remove ' - ' (3 characters)
    }
    return afterSuffix
  }

  // Check status in priority order
  if (trailing.startsWith(UNINSTALLATION_ERROR_SUFFIX)) {
    return {
      status: 'uninstall_error',
      version,
      errorMessage: extractError(trailing.slice(UNINSTALLATION_ERROR_SUFFIX.length)),
    }
  }

  if (trailing.startsWith(INSTALLATION_ERROR_SUFFIX)) {
    return {
      status: 'install_error',
      version,
      errorMessage: extractError(trailing.slice(INSTALLATION_ERROR_SUFFIX.length)),
    }
  }

  if (trailing.startsWith(UNINSTALLATION_STARTED_SUFFIX)) {
    return { status: 'uninstalling', version }
  }

  if (trailing.startsWith(INSTALLATION_STARTED_SUFFIX)) {
    return { status: 'installing', version }
  }

  if (trailing.startsWith(INSTALLATION_INSTALLED_SUFFIX)) {
    return { status: 'installed', version }
  }

  return { status: 'uninstalled' }
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
