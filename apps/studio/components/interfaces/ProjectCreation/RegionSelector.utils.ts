import { z } from 'zod'

import { captureCriticalError } from '@/lib/error-reporting'

export const RESTRICTED_REGIONS_FLAG_KEY = 'projectCreationRestrictedRegions'

export type PlatformRegionStatus = 'capacity' | 'other'

const FLAG_RESTRICTIONS = ['unavailable', 'paid_only'] as const
export type FlagRestriction = (typeof FLAG_RESTRICTIONS)[number]

export type RegionRestriction = PlatformRegionStatus | FlagRestriction

export const SELECTABLE_RESTRICTIONS: ReadonlySet<RegionRestriction> = new Set(['paid_only'])

const RestrictedRegionsSchema = z.record(z.string(), z.enum(FLAG_RESTRICTIONS))

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
  isFreePlan: boolean | undefined
}

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
  { badge: string; badgeVariant: 'warning' | 'success'; tooltip: string }
> = {
  capacity: {
    badge: 'Unavailable',
    badgeVariant: 'warning',
    tooltip: 'Temporarily unavailable due to this region being at capacity.',
  },
  other: {
    badge: 'Unavailable',
    badgeVariant: 'warning',
    tooltip: 'Temporarily unavailable for new projects.',
  },
  unavailable: {
    badge: 'Unavailable',
    badgeVariant: 'warning',
    tooltip: 'Temporarily unavailable for new projects.',
  },
  paid_only: {
    badge: 'Paid plans',
    badgeVariant: 'success',
    tooltip: 'Available on paid plans only.',
  },
}
