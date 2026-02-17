import type { Schema } from 'data/database/schemas-query'
import {
  INSTALLATION_ERROR_SUFFIX,
  INSTALLATION_INSTALLED_SUFFIX,
  INSTALLATION_STARTED_SUFFIX,
  STRIPE_SCHEMA_COMMENT_PREFIX,
} from 'stripe-experiment-sync/supabase'

import type { StripeInstallationStatus } from '@/components/interfaces/Integrations/templates/StripeSyncEngine/stripe-sync'
import { StripeSyncStateData } from '@/data/database-integrations/stripe/sync-state-query'

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

export function hasError(status: StripeInstallationStatus): boolean {
  return status === 'install_error' || status === 'uninstall_error'
}

export function isInProgress(status: StripeInstallationStatus): boolean {
  return status === 'installing' || status === 'uninstalling'
}

export function canInstall(status: StripeInstallationStatus): boolean {
  return status === 'uninstalled' || status === 'install_error' || status === 'uninstall_error'
}

export function isSyncRunning(syncState: StripeSyncStateData | undefined): boolean {
  return !!syncState && !syncState.closed_at && syncState.status === 'running'
}
