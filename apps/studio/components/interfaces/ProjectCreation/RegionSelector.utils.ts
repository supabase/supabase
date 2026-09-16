import { z } from 'zod'

import { captureCriticalError } from '@/lib/error-reporting'

export const RESTRICTED_REGIONS_FLAG_KEY = 'projectCreationRestrictedRegions'

export type PlatformRegionStatus = 'capacity' | 'other'

const FLAG_RESTRICTIONS = ['unavailable', 'paid_only'] as const
export type FlagRestriction = (typeof FLAG_RESTRICTIONS)[number]

export type RegionRestriction = PlatformRegionStatus | FlagRestriction

// Restrictions in this set stay selectable in the picker (badge + notice, blocked on submit)
// instead of being disabled. Empty for now; the render and submit paths already read from it.
export const SELECTABLE_RESTRICTIONS: ReadonlySet<RegionRestriction> = new Set()

const RestrictedRegionsSchema = z.record(z.string(), z.enum(FLAG_RESTRICTIONS))

/**
 * Parses the ConfigCat text flag payload `{ "<region code>": "unavailable" | "paid_only" }`.
 *
 * Fails open: anything other than a well-formed payload (the `false` that `useFlag` returns
 * when unresolved or errored, an empty string, invalid JSON, wrong shape, unknown status
 * values) yields no restrictions. A present-but-invalid payload is reported so a typo in
 * ConfigCat is visible rather than silently inert.
 */
export function parseRestrictedRegions(flagValue: unknown): Record<string, FlagRestriction> {
  if (typeof flagValue !== 'string' || flagValue.trim() === '') return {}

  let payload: unknown
  try {
    payload = JSON.parse(flagValue)
  } catch {
    reportInvalidPayload(flagValue, 'invalid JSON')
    return {}
  }

  const result = RestrictedRegionsSchema.safeParse(payload)
  if (!result.success) {
    reportInvalidPayload(flagValue, result.error.issues[0]?.message ?? 'invalid shape')
    return {}
  }

  return result.data
}

function reportInvalidPayload(flagValue: string, reason: string) {
  captureCriticalError(
    new Error(`Ignoring ${RESTRICTED_REGIONS_FLAG_KEY} flag (${reason}): ${flagValue}`),
    'parse restricted regions flag'
  )
}

type ResolveRegionRestrictionArgs = {
  platformStatus: PlatformRegionStatus | undefined
  flagRestriction: FlagRestriction | undefined
  /** `undefined` while the organization is still loading, which fails open to paid */
  isFreePlan: boolean | undefined
}

/**
 * Platform status wins over the flag so enabling a platform-side block never produces two
 * competing messages on one option. `paid_only` only applies to organizations known to be
 * on the free plan.
 */
export function resolveRegionRestriction({
  platformStatus,
  flagRestriction,
  isFreePlan,
}: ResolveRegionRestrictionArgs): RegionRestriction | undefined {
  if (platformStatus !== undefined) return platformStatus
  if (flagRestriction === 'paid_only') return isFreePlan === true ? 'paid_only' : undefined
  return flagRestriction
}

export const REGION_RESTRICTION_COPY: Record<
  RegionRestriction,
  { badge: string; tooltip: string }
> = {
  capacity: {
    badge: 'Unavailable',
    tooltip: 'Temporarily unavailable due to this region being at capacity.',
  },
  other: {
    badge: 'Unavailable',
    tooltip: 'Temporarily unavailable for new projects.',
  },
  unavailable: {
    badge: 'Unavailable',
    tooltip: 'Temporarily unavailable for new projects.',
  },
  paid_only: {
    badge: 'Paid plans',
    tooltip: 'Available on paid plans only.',
  },
}
