import type { ExpirationMode } from '../StorageVersioning.constants'

export type VersionFate =
  | { type: 'kept' }
  | { type: 'expires-in'; days: number }
  /**
   * The cap forces this one out, so the date depends on the next upload.
   * `daysRemaining` is set when an age rule is also configured.
   */
  | { type: 'expires-on-next-upload'; daysRemaining?: number }
  | { type: 'expiring-now' }

export interface ComputeVersionFateOptions {
  /** Days since this version became noncurrent. */
  daysOld: number
  /** 0-based position among noncurrent versions, oldest first. */
  chronoIndex: number
  /** Total number of noncurrent versions the object currently has. */
  noncurrentCount: number
  expiryDays: number | null
  cap: number | null
  mode: ExpirationMode
}

/** Treats a missing or non-positive bound as "condition not set". */
const toActiveBound = (value: number | null) => (value !== null && value > 0 ? value : null)

/**
 * The removal-outlook label a version row shows. Governing rule: never show a
 * countdown unless removal is actually guaranteed under the current policy — a
 * row only gets a day count once every other condition is already satisfied.
 * So a cap-only policy shows no dates except at the boundary, and an `and`
 * policy shows one only once the cap is already exceeded.
 *
 * Each branch has a worked reference case in `VersionHistory.utils.test.ts`.
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

  if (activeExpiryDays === null) {
    if (activeCap === null) return { type: 'kept' }

    // Cap only: the oldest version still inside the cap is next to be evicted.
    const isAtCapBoundary = chronoIndex === noncurrentCount - activeCap
    return isAtCapBoundary ? { type: 'expires-on-next-upload' } : { type: 'kept' }
  }

  const isAgeExceeded = daysOld >= activeExpiryDays
  const daysRemaining = activeExpiryDays - daysOld

  if (activeCap === null) {
    return isAgeExceeded ? { type: 'expiring-now' } : { type: 'expires-in', days: daysRemaining }
  }

  // Already beyond the cap: among the oldest `noncurrentCount - cap` versions.
  const isCapExceeded = chronoIndex < noncurrentCount - activeCap
  const isAtCapBoundary = chronoIndex === noncurrentCount - activeCap

  if (mode === 'and') {
    if (!isCapExceeded) return { type: 'kept' }
    return isAgeExceeded ? { type: 'expiring-now' } : { type: 'expires-in', days: daysRemaining }
  }

  if (isAgeExceeded || isCapExceeded) return { type: 'expiring-now' }
  if (isAtCapBoundary) return { type: 'expires-on-next-upload', daysRemaining }
  return { type: 'expires-in', days: daysRemaining }
}
