import type { BucketVersioningState } from '@/components/interfaces/Storage/StorageVersioning.constants'

export type RetentionTightening = 'none' | 'days' | 'versions' | 'both'

interface GetRetentionTighteningParams {
  initialVersioningState: BucketVersioningState
  isVersioningEnabled: boolean
  initialRetentionDays: number | null | undefined
  initialMaxVersions: number | null | undefined
  nextRetentionDays: number | null
  nextMaxVersions: number | null
}

/**
 * `null` is an unbounded bound, so introducing one expires versions that were being
 * kept forever. `undefined` is the bound still loading, which says nothing either way.
 */
const isTightening = (initial: number | null | undefined, next: number | null) =>
  initial !== undefined && next !== null && (initial === null || next < initial)

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

  const isTighteningDays = isTightening(initialRetentionDays, nextRetentionDays)
  const isTighteningVersions = isTightening(initialMaxVersions, nextMaxVersions)

  if (isTighteningDays && isTighteningVersions) return 'both'
  if (isTighteningDays) return 'days'
  if (isTighteningVersions) return 'versions'
  return 'none'
}

export const RETENTION_TIGHTENING_DESCRIPTION: Record<
  Exclude<RetentionTightening, 'none'>,
  string
> = {
  both: 'Saving permanently deletes noncurrent versions past the retention window, and any beyond the per-object cap.',
  days: 'Saving permanently deletes noncurrent versions past the retention window.',
  versions: 'Saving permanently deletes noncurrent versions beyond the per-object cap.',
}

export const toNullableNumber = (value: '' | number): number | null =>
  typeof value === 'number' ? value : null
