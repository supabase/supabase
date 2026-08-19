import type { ExpirationMode } from '../StorageVersioning.constants'

export type VersionFate =
  | { type: 'retained' }
  | { type: 'expires-in'; days: number }
  /**
   * The cap forces this one out before its age would, so the exact date depends
   * on when the next upload happens. `daysRemaining` is the date it would have
   * hit anyway had the cap not got there first.
   */
  | { type: 'expires-on-next-upload'; daysRemaining: number }
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
 * row only gets a day count once every other condition is already satisfied. So
 * an `and` policy shows one only once the cap is already exceeded.
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

  // A cap with no age isn't expressible in S3 — NoncurrentDays is required on any
  // NoncurrentVersionExpiration rule, which is why the bucket form disables the
  // cap until an age is set. So no age means no policy, whatever the cap says.
  if (activeExpiryDays === null) return { type: 'retained' }

  const isAgeExceeded = daysOld >= activeExpiryDays
  const daysRemaining = activeExpiryDays - daysOld

  if (activeCap === null) {
    return isAgeExceeded ? { type: 'expiring-now' } : { type: 'expires-in', days: daysRemaining }
  }

  // Already beyond the cap: among the oldest `noncurrentCount - cap` versions.
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
