import type { Schema } from 'data/database/schemas-query'
import {
  INSTALLATION_ERROR_SUFFIX,
  INSTALLATION_INSTALLED_SUFFIX,
  INSTALLATION_STARTED_SUFFIX,
  STRIPE_SCHEMA_COMMENT_PREFIX,
  UNINSTALLATION_ERROR_SUFFIX,
  UNINSTALLATION_STARTED_SUFFIX,
} from 'stripe-experiment-sync/supabase'

import type { StripeInstallationStatus } from '@/components/interfaces/Integrations/templates/StripeSyncEngine/stripe-sync'

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

export function hasError(status: StripeInstallationStatus): boolean {
  return status === 'install_error' || status === 'uninstall_error'
}

export function isInProgress(status: StripeInstallationStatus): boolean {
  return status === 'installing' || status === 'uninstalling'
}

export function canInstall(status: StripeInstallationStatus): boolean {
  return status === 'uninstalled' || status === 'install_error' || status === 'uninstall_error'
}
