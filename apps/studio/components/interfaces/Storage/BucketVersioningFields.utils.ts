import type { BucketVersioningState } from './StorageVersioning.constants'

/** Which lifecycle conditions the user has just made stricter. */
export type RetentionTightening = 'none' | 'days' | 'versions' | 'both'

interface GetRetentionTighteningParams {
  initialVersioningState: BucketVersioningState
  isVersioningEnabled: boolean
  initialRetentionDays: number | null | undefined
  initialMaxVersions: number | null | undefined
  /** `null` for the empty sentinel. */
  nextRetentionDays: number | null
  /** `null` for the empty sentinel. */
  nextMaxVersions: number | null
}

/**
 * Only a bucket that was already actively versioning can lose data to a
 * tightened policy: enabling for the first time has nothing retained to expire,
 * and suspending stops new versions without touching old ones.
 *
 * Raising or clearing a bound is never a tightening — clearing removes the
 * condition, which can only retain more.
 */
export const getRetentionTightening = ({
  initialVersioningState,
  isVersioningEnabled,
  initialRetentionDays,
  initialMaxVersions,
  nextRetentionDays,
  nextMaxVersions,
}: GetRetentionTighteningParams): RetentionTightening => {
  if (initialVersioningState !== 'enabled' || !isVersioningEnabled) return 'none'

  const isTighteningDays =
    initialRetentionDays !== null &&
    initialRetentionDays !== undefined &&
    nextRetentionDays !== null &&
    nextRetentionDays < initialRetentionDays

  const isTighteningVersions =
    initialMaxVersions !== null &&
    initialMaxVersions !== undefined &&
    nextMaxVersions !== null &&
    nextMaxVersions < initialMaxVersions

  if (isTighteningDays && isTighteningVersions) return 'both'
  if (isTighteningDays) return 'days'
  if (isTighteningVersions) return 'versions'
  return 'none'
}

export const RETENTION_TIGHTENING_DESCRIPTION: Record<
  Exclude<RetentionTightening, 'none'>,
  string
> = {
  both: 'Saving permanently deletes noncurrent versions past the shorter retention window, and any beyond the lower per-object cap.',
  days: 'Saving permanently deletes noncurrent versions past the shorter retention window.',
  versions: 'Saving permanently deletes noncurrent versions beyond the lower per-object cap.',
}

/** Converts the form's `'' | number` sentinel into a plain nullable number. */
export const toNullableNumber = (value: '' | number): number | null =>
  typeof value === 'number' ? value : null
