import type { ExpirationMode } from '../StorageProtection.constants'

export type VersionFate =
  | { type: 'kept' }
  | { type: 'expires-in'; days: number }
  | { type: 'expires-on-next-upload' }
  | { type: 'expiring-now' }

export interface ComputeVersionFateOptions {
  /** Days since this version became noncurrent. */
  daysOld: number
  /** 0-based position among noncurrent versions, oldest = 0. */
  chronoIndex: number
  /** Total number of noncurrent versions this object currently has. */
  noncurrentCount: number
  expiryDays: number | null
  cap: number | null
  mode: ExpirationMode
}

/**
 * Derives the single removal-outlook label a version-history row shows,
 * per the governing rule: never show a countdown/date unless it's actually
 * guaranteed under the current policy — a row only gets a day-count once
 * every other condition for its removal is already satisfied.
 *
 * - Age-only: every version has a determined date (`expires-in`, or
 *   `expiring-now` once the window has passed).
 * - Count-only: no version has a determined date — a future upload could
 *   always evict it early — except the one right at the cap boundary, which
 *   is one upload away from being pushed out (`expires-on-next-upload`).
 * - Both, joined with AND: a version only gets a date once it has already
 *   exceeded the count threshold, since age is then the sole remaining gate.
 *   Versions still within the count threshold are `kept` regardless of age.
 * - Both, joined with OR: almost every version gets an age-based countdown,
 *   since age alone can trigger removal — except a version can still be
 *   `expires-on-next-upload` if the count rule would evict it before its age
 *   countdown completes.
 *
 * See the 7 reference cases in `VersionHistory.utils.test.ts` — each one
 * mirrors a worked example from the design handoff.
 */
export const computeVersionFate = ({
  daysOld,
  chronoIndex,
  noncurrentCount,
  expiryDays,
  cap,
  mode,
}: ComputeVersionFateOptions): VersionFate => {
  const hasDays = expiryDays !== null && expiryDays > 0
  const hasCap = cap !== null && cap > 0

  if (!hasDays && !hasCap) return { type: 'kept' }

  const ageExceeded = hasDays && daysOld >= expiryDays
  const daysRemaining = hasDays ? expiryDays - daysOld : null
  // Already beyond the cap: among the oldest (noncurrentCount - cap) versions.
  const capExceeded = hasCap && chronoIndex < noncurrentCount - cap
  // The oldest version still inside the cap — next to be evicted by a future upload.
  const atCapBoundary = hasCap && chronoIndex === noncurrentCount - cap

  if (hasDays && !hasCap) {
    return ageExceeded ? { type: 'expiring-now' } : { type: 'expires-in', days: daysRemaining! }
  }

  if (hasCap && !hasDays) {
    return atCapBoundary ? { type: 'expires-on-next-upload' } : { type: 'kept' }
  }

  if (mode === 'and') {
    if (!capExceeded) return { type: 'kept' }
    return ageExceeded ? { type: 'expiring-now' } : { type: 'expires-in', days: daysRemaining! }
  }

  // mode === 'or'
  if (ageExceeded || capExceeded) return { type: 'expiring-now' }
  if (atCapBoundary) return { type: 'expires-on-next-upload' }
  return { type: 'expires-in', days: daysRemaining! }
}
