import type { BucketVersioningFormValues } from './BucketVersioningFields.schema'
import {
  PROJECT_VERSIONING_DEFAULTS,
  type BucketVersioningState,
  type ExpirationMode,
} from './StorageVersioning.constants'

/** A bucket's persisted object versioning settings, as the edit form reads them. */
export interface BucketVersioningSettings {
  versioning: BucketVersioningState
  /** `null` when no age condition is part of the lifecycle policy. */
  versionExpiryDays: number | null
  /** `null` when no version cap is part of the lifecycle policy. */
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
 * Turning versioning off suspends rather than disables: S3 has no path back to
 * `disabled` once a bucket has been versioned. A never-versioned bucket stays
 * `disabled`.
 */
export const getNextVersioningState = (
  currentState: BucketVersioningState,
  isVersioningEnabled: boolean
): BucketVersioningState => {
  if (isVersioningEnabled) return 'enabled'
  return currentState === 'disabled' ? 'disabled' : 'suspended'
}

/** True when saving would stop an actively versioning bucket — worth confirming. */
export const isSuspendingVersioning = (
  currentState: BucketVersioningState,
  isVersioningEnabled: boolean
) => currentState === 'enabled' && !isVersioningEnabled
