import type { ExpirationMode } from '../StorageVersioning.constants'

export type VersionFate =
  | { type: 'retained' }
  | { type: 'expires-in'; days: number }
  | { type: 'expires-on-next-upload'; daysRemaining: number }
  | { type: 'expiring-now' }

export interface ComputeVersionFateOptions {
  daysOld: number
  chronoIndex: number
  noncurrentCount: number
  expiryDays: number | null
  cap: number | null
  mode: ExpirationMode
}

/** Treats a missing or non-positive bound as "condition not set". */
const toActiveBound = (value: number | null) => (value !== null && value > 0 ? value : null)

/**
 * Never show a countdown unless removal is actually guaranteed under the current policy —
 * a row only gets a day count once every other condition is already satisfied. So
 * an `and` policy shows one only once the cap is already exceeded.
 */
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

  // A cap with no age isn't expressible in S3 — NoncurrentDays is required
  if (activeExpiryDays === null) return { type: 'retained' }

  const isAgeExceeded = daysOld >= activeExpiryDays
  const daysRemaining = activeExpiryDays - daysOld

  if (activeCap === null) {
    return isAgeExceeded ? { type: 'expiring-now' } : { type: 'expires-in', days: daysRemaining }
  }

  const isCapExceeded = chronoIndex < noncurrentCount - activeCap
  const isAtCapBoundary = chronoIndex === noncurrentCount - activeCap

  if (mode === 'and') {
    if (!isCapExceeded) return { type: 'retained' }
    return isAgeExceeded ? { type: 'expiring-now' } : { type: 'expires-in', days: daysRemaining }
  }

  if (isAgeExceeded || isCapExceeded) return { type: 'expiring-now' }
  if (isAtCapBoundary) return { type: 'expires-on-next-upload', daysRemaining }
  return { type: 'expires-in', days: daysRemaining }
}
