import { type VersioningPlanLimits } from './StorageProtection.constants'

/**
 * Parses a raw (possibly empty/partial) numeric input string into a number.
 * Returns `undefined` for empty strings or values that aren't a valid integer,
 * so the caller can distinguish "not provided" from "provided but invalid".
 */
export const parseVersioningNumberField = (raw: string | undefined): number | undefined => {
  const trimmed = raw?.trim() ?? ''
  if (trimmed.length === 0) return undefined

  const parsed = Number(trimmed)
  return Number.isInteger(parsed) ? parsed : undefined
}

export interface VersioningFieldErrors {
  version_expiry_days?: string
  max_noncurrent_versions?: string
}

/**
 * Validates the versioning retention/max-versions fields against the current
 * org plan's bounds. Returns an empty object when there's nothing to report.
 */
export const validateVersioningFields = ({
  isEnabled,
  expiryDaysRaw,
  maxVersionsRaw,
  limits,
}: {
  isEnabled: boolean
  expiryDaysRaw: string | undefined
  maxVersionsRaw: string | undefined
  limits: VersioningPlanLimits | null
}): VersioningFieldErrors => {
  if (!isEnabled || !limits) return {}

  const errors: VersioningFieldErrors = {}

  const expiryDays = parseVersioningNumberField(expiryDaysRaw)
  if (expiryDays === undefined) {
    errors.version_expiry_days = 'Please provide a retention period'
  } else if (expiryDays < limits.minRetentionDays || expiryDays > limits.maxRetentionDays) {
    errors.version_expiry_days = `Must be between ${limits.minRetentionDays} and ${limits.maxRetentionDays} days on your plan`
  }

  const maxVersions = parseVersioningNumberField(maxVersionsRaw)
  if (maxVersions === undefined) {
    errors.max_noncurrent_versions = 'Please provide a value'
  } else if (maxVersions < limits.minVersions || maxVersions > limits.maxVersions) {
    errors.max_noncurrent_versions = `Must be between ${limits.minVersions} and ${limits.maxVersions} versions on your plan`
  }

  return errors
}
