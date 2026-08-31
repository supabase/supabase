import type { BucketVersioningFormValues } from './BucketVersioningFields.schema'
import {
  PROJECT_VERSIONING_DEFAULTS,
  type BucketVersioningState,
  type ExpirationMode,
} from './StorageVersioning.constants'

export interface BucketVersioningSettings {
  versioning: BucketVersioningState
  versionExpiryDays: number | null
  maxNoncurrentVersions: number | null
  expirationMode: ExpirationMode
}

/**
 * A never-versioned bucket has no stored policy, so it prefills the project
 * defaults. A versioned or suspended one shows its own policy, and an unset
 * condition stays unset (`''`) — prefilling there would silently add a bound the
 * user never chose.
 */
export const getVersioningFormDefaults = (
  settings: BucketVersioningSettings
): BucketVersioningFormValues => {
  const hasEverBeenVersioned = settings.versioning !== 'disabled'

  if (!hasEverBeenVersioned) {
    return {
      enable_versioning: false,
      version_expiry_days: PROJECT_VERSIONING_DEFAULTS.versionExpiryDays,
      max_noncurrent_versions: PROJECT_VERSIONING_DEFAULTS.maxNoncurrentVersions,
      expiration_mode: 'and',
    }
  }

  return {
    enable_versioning: settings.versioning === 'enabled',
    version_expiry_days: settings.versionExpiryDays ?? '',
    max_noncurrent_versions: settings.maxNoncurrentVersions ?? '',
    expiration_mode: settings.expirationMode,
  }
}

/**
 * Turning versioning off suspends rather than disables.
 */
export const getNextVersioningState = (
  currentState: BucketVersioningState,
  isVersioningEnabled: boolean
): BucketVersioningState => {
  if (isVersioningEnabled) return 'enabled'
  return currentState === 'disabled' ? 'disabled' : 'suspended'
}

export const isSuspendingVersioning = (
  currentState: BucketVersioningState,
  isVersioningEnabled: boolean
) => currentState === 'enabled' && !isVersioningEnabled

/**
 * True when saving would turn versioning on for a bucket that has never had it.
 * Re-enabling a suspended bucket doesn't count — the user already opted in once,
 * and its retained versions never went away.
 */
export const isEnablingVersioning = (
  currentState: BucketVersioningState,
  isVersioningEnabled: boolean
) => currentState === 'disabled' && isVersioningEnabled
