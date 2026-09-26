import type { BucketVersioningState } from './StorageVersioning.constants'

export type RetentionTightening = 'none' | 'days' | 'versions' | 'both'

interface GetRetentionTighteningParams {
  initialVersioningState: BucketVersioningState
  isVersioningEnabled: boolean
  initialRetentionDays: number | null | undefined
  initialMaxVersions: number | null | undefined
  nextRetentionDays: number | null
  nextMaxVersions: number | null
}

/** Only an already-enabled bucket can lose data to a tightened policy. */
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

export const toNullableNumber = (value: '' | number): number | null =>
  typeof value === 'number' ? value : null
