import { MIN_NONCURRENT_DAYS } from '../BucketVersioningFields.lifecycle'
import type { ExpirationMode } from '../StorageVersioning.constants'

export type VersionFate =
  | { type: 'retained' }
  | { type: 'expires-in'; days: number }
  | { type: 'expires-on-next-upload'; daysRemaining: number }
  | { type: 'expiry-due' }

export interface ComputeVersionFateOptions {
  daysOld: number
  chronoIndex: number
  noncurrentCount: number
  expiryDays: number | null
  cap: number | null
  mode: ExpirationMode
}

const toActiveBound = (value: number | null) => (value !== null && value > 0 ? value : null)

/** A row gets a countdown only once every other condition is already satisfied. */
export const computeVersionFate = ({
  daysOld,
  chronoIndex,
  noncurrentCount,
  expiryDays,
  cap,
  mode,
}: ComputeVersionFateOptions): VersionFate => {
  const activeExpiryDays = toActiveBound(expiryDays)
  const activeCap = toActiveBound(cap)

  // S3 requires NoncurrentDays, so a cap with no age isn't expressible.
  if (activeExpiryDays === null) return { type: 'retained' }

  const isAgeExceeded = daysOld >= activeExpiryDays
  const daysRemaining = activeExpiryDays - daysOld

  if (activeCap === null) {
    return isAgeExceeded ? { type: 'expiry-due' } : { type: 'expires-in', days: daysRemaining }
  }

  const isCapExceeded = chronoIndex < noncurrentCount - activeCap
  const isAtCapBoundary = chronoIndex === noncurrentCount - activeCap

  if (mode === 'and') {
    if (!isCapExceeded) return { type: 'retained' }
    return isAgeExceeded ? { type: 'expiry-due' } : { type: 'expires-in', days: daysRemaining }
  }

  if (isAgeExceeded) return { type: 'expiry-due' }
  // The cap rule carries its own `noncurrent_days` floor, so exceeding the cap is not
  // enough on its own — the version has to be old enough for that rule to touch it.
  if (isCapExceeded) {
    return daysOld >= MIN_NONCURRENT_DAYS
      ? { type: 'expiry-due' }
      : { type: 'expires-in', days: MIN_NONCURRENT_DAYS - daysOld }
  }
  if (isAtCapBoundary) return { type: 'expires-on-next-upload', daysRemaining }
  return { type: 'expires-in', days: daysRemaining }
}
