import type { Schema } from 'data/database/schemas-query'
import {
  INSTALLATION_ERROR_SUFFIX,
  INSTALLATION_INSTALLED_SUFFIX,
  INSTALLATION_STARTED_SUFFIX,
  STRIPE_SCHEMA_COMMENT_PREFIX,
  UNINSTALLATION_ERROR_SUFFIX,
  UNINSTALLATION_STARTED_SUFFIX,
} from 'stripe-experiment-sync/supabase'

import type {
  StripeInstallationStatus,
  StripeInstallationStatusType,
} from '@/components/interfaces/Integrations/templates/StripeSyncEngine/stripe-sync'

/**
 * Find the stripe schema from a list of schemas
 */
export function findStripeSchema(schemas: Schema[] | undefined): Schema | undefined {
  return schemas?.find((s) => s.name === 'stripe')
}

/**
 * Check if a schema comment indicates it was created by the Stripe Sync integration
 */
function isStripeSyncSchema(schema: Schema | undefined): boolean {
  return !!schema?.comment?.startsWith(STRIPE_SCHEMA_COMMENT_PREFIX)
}

/**
 * Check if a schema comment includes a specific status suffix
 */
function hasStatusSuffix(schema: Schema | undefined, suffix: string): boolean {
  return isStripeSyncSchema(schema) && !!schema?.comment?.includes(suffix)
}

/**
 * Parse the installation status from a stripe schema.
 * Returns a discriminated union that makes impossible states unrepresentable.
 *
 * @param stripeSchema - The stripe schema from the database, if it exists
 * @returns A discriminated union of all possible installation states
 */
export function parseStripeSchemaStatus(
  stripeSchema: Schema | undefined
): StripeInstallationStatus {
  // No stripe schema exists
  if (!stripeSchema) {
    return { status: 'not_installed', hasConflictingSchema: false }
  }

  // Schema exists but wasn't created by our integration (conflicting)
  if (!isStripeSyncSchema(stripeSchema)) {
    return { status: 'conflicting_schema', hasConflictingSchema: true }
  }

  // Check for error states first (they take precedence)
  if (hasStatusSuffix(stripeSchema, UNINSTALLATION_ERROR_SUFFIX)) {
    return { status: 'uninstall_error', hasConflictingSchema: false }
  }

  if (hasStatusSuffix(stripeSchema, INSTALLATION_ERROR_SUFFIX)) {
    return { status: 'install_error', hasConflictingSchema: false }
  }

  // Check for in-progress states
  if (hasStatusSuffix(stripeSchema, UNINSTALLATION_STARTED_SUFFIX)) {
    return { status: 'uninstalling', hasConflictingSchema: false }
  }

  if (hasStatusSuffix(stripeSchema, INSTALLATION_STARTED_SUFFIX)) {
    return { status: 'installing', hasConflictingSchema: false }
  }

  // Check for installed state
  if (hasStatusSuffix(stripeSchema, INSTALLATION_INSTALLED_SUFFIX)) {
    return { status: 'installed', hasConflictingSchema: false }
  }

  // Schema exists with our prefix but unknown state - treat as not installed
  return { status: 'not_installed', hasConflictingSchema: false }
}

/**
 * Type guard to check if the status indicates the integration is installed
 */
export function isInstalled(status: StripeInstallationStatus): boolean {
  return status.status === 'installed'
}

/**
 * Type guard to check if the status indicates an error occurred
 */
export function hasError(status: StripeInstallationStatus): boolean {
  return status.status === 'install_error' || status.status === 'uninstall_error'
}

/**
 * Type guard to check if an operation is in progress
 */
export function isInProgress(status: StripeInstallationStatus): boolean {
  return status.status === 'installing' || status.status === 'uninstalling'
}

/**
 * Check if installation is possible (no conflicting schema and not already installed/in-progress)
 */
export function canInstall(status: StripeInstallationStatus): boolean {
  return (
    status.status === 'not_installed' ||
    status.status === 'install_error' ||
    status.status === 'uninstall_error'
  )
}

/**
 * Simple helper to check if a status matches one of the given types
 */
export function statusIs(
  status: StripeInstallationStatus,
  ...types: StripeInstallationStatusType[]
): boolean {
  return types.includes(status.status)
}
