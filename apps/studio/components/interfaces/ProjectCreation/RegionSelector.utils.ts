import { z } from 'zod'

import { captureCriticalError } from '@/lib/error-reporting'
import { normalizeRegion, type StatusItem } from '@/lib/status-page/status-page.utils'

export const RESTRICTED_REGIONS_FLAG_KEY = 'projectCreationRestrictedRegions'

export type PlatformRegionStatus = 'capacity' | 'other'

const FLAG_RESTRICTIONS = ['unavailable'] as const
export type FlagRestriction = (typeof FLAG_RESTRICTIONS)[number]

export type RegionRestriction = PlatformRegionStatus | FlagRestriction

export type RegionRestrictionCopy = {
  badge: string
  title: string
  tooltip: string
  notice: string
}

const GENERIC_RESTRICTION_COPY: RegionRestrictionCopy = {
  badge: 'Unavailable',
  title: 'Selected region is unavailable',
  tooltip: 'Temporarily unavailable for new projects.',
  notice: 'This region is temporarily unavailable for new projects.',
}

export const REGION_RESTRICTION_COPY: Record<RegionRestriction, RegionRestrictionCopy> = {
  capacity: {
    badge: 'Unavailable',
    title: 'Selected region is at capacity',
    tooltip: 'Temporarily unavailable due to this region being at capacity.',
    notice:
      'This region currently has capacity for Micro compute and above. Free plan projects run on Nano compute.',
  },
  other: GENERIC_RESTRICTION_COPY,
  unavailable: GENERIC_RESTRICTION_COPY,
}

export const SELECT_DIFFERENT_REGION = 'Select a different region to continue.'

function isKnownRestriction(value: string): value is RegionRestriction {
  return Object.prototype.hasOwnProperty.call(REGION_RESTRICTION_COPY, value)
}

export function getRegionRestrictionCopy(restriction: string): RegionRestrictionCopy {
  return isKnownRestriction(restriction)
    ? REGION_RESTRICTION_COPY[restriction]
    : GENERIC_RESTRICTION_COPY
}

export function getRegionRestrictionMessage(restriction: string) {
  return `${getRegionRestrictionCopy(restriction).title}. ${SELECT_DIFFERENT_REGION}`
}

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
  platformStatus: string | undefined
  flagRestriction: FlagRestriction | undefined
}

export function resolveRegionRestriction({
  platformStatus,
  flagRestriction,
}: ResolveRegionRestrictionArgs): string | undefined {
  return platformStatus ?? flagRestriction
}

// Maps smart region group codes to the specific-region code prefixes they contain.
// Used to check whether a status item affecting specific regions also affects a smart region selection.
export const SMART_REGION_PREFIXES: Record<string, Array<string>> = {
  americas: ['us-', 'ca-', 'sa-'],
  emea: ['eu-', 'me-', 'af-'],
  apac: ['ap-'],
}

export function regionMatches(selectedCode: string, affectedRegion: string): boolean {
  const normalizedSelected = normalizeRegion(selectedCode)
  const normalizedAffected = normalizeRegion(affectedRegion)
  if (normalizedSelected === normalizedAffected) return true
  return (SMART_REGION_PREFIXES[normalizedSelected] ?? []).some((prefix) =>
    normalizedAffected.startsWith(prefix)
  )
}

export function getItemsAffectingProjectCreation(
  items: Array<StatusItem>,
  selectedRegionCode: string | undefined
): Array<StatusItem> {
  return items.filter((item) => {
    if (item.kind !== 'incident' && item.kind !== 'maintenance') return false
    if (item.projectCreationScope === null) return false
    if (item.projectCreationScope.type === 'global') return true
    return (
      selectedRegionCode !== undefined &&
      item.projectCreationScope.regions.some((region) => regionMatches(selectedRegionCode, region))
    )
  })
}
