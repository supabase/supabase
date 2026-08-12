import {
  getCatalogEntry,
  PERMISSION_CATALOG,
  type PermissionCatalogEntry,
  type PermissionSelection,
  type ResourceAccessMode,
  type RiskLevel,
} from '../../AccessToken.permissions'
import type { CapabilitySummaryEntry } from '../../hooks/useCapabilitySummary'
import {
  CAPABILITY_DENSITY_ACCORDION_MAX,
  CAPABILITY_DENSITY_EXPANDED_MAX,
} from './TokenCapabilities.constants'
import { pluralize } from '@/lib/helpers'

export type CapabilityDensityTier = 'expanded' | 'accordion' | 'dense'

export const getCapabilityDensityTier = (count: number): CapabilityDensityTier => {
  if (count <= CAPABILITY_DENSITY_EXPANDED_MAX) return 'expanded'
  if (count <= CAPABILITY_DENSITY_ACCORDION_MAX) return 'accordion'
  return 'dense'
}

/**
 * Longest shared leading path segments across a group of endpoint paths, so the UI can mute the
 * boilerplate prefix and highlight only the segment that distinguishes each row. Matching is
 * segment-aware (split on "/") so a shared prefix never cuts a path mid-segment. A single-endpoint
 * group has nothing to share, so the whole path is treated as the distinguishing part.
 */
export const getSharedPathPrefix = (paths: string[]): string => {
  if (paths.length < 2) return ''

  const segmentLists = paths.map((path) => path.split('/'))
  const [first, ...rest] = segmentLists
  let matched = 0
  while (matched < first.length && rest.every((segments) => segments[matched] === first[matched])) {
    matched++
  }
  // Every path is identical (not just the shortest one fully consumed as a prefix of a longer
  // one) — back off one segment so each path keeps at least the last as its distinguishing part.
  if (segmentLists.every((segments) => segments.length === matched)) matched -= 1
  // matched === 1 only captures the empty segment before the leading "/", shared trivially by
  // every absolute path — not a meaningful prefix.
  if (matched <= 1) return ''
  return first.slice(0, matched).join('/') + '/'
}

export const splitEndpointPath = (path: string, sharedPrefix: string) =>
  sharedPrefix !== '' && path.startsWith(sharedPrefix)
    ? { prefix: sharedPrefix, distinguishing: path.slice(sharedPrefix.length) }
    : { prefix: '', distinguishing: path }

export const groupCapabilitiesByLevel = (capabilities: CapabilitySummaryEntry[]) => ({
  readwrite: capabilities.filter((capability) => capability.mode === 'readwrite'),
  read: capabilities.filter((capability) => capability.mode === 'read'),
})

/** Catalog entries the token doesn't grant at all — dense mode's "Not granted" group. */
export const getNotGrantedCatalogEntries = (
  capabilities: CapabilitySummaryEntry[]
): PermissionCatalogEntry[] => {
  const grantedKeys = new Set(capabilities.map((capability) => capability.entry.key))
  return PERMISSION_CATALOG.filter((entry) => !grantedKeys.has(entry.key))
}

export type CapabilityLevelFilter = 'all' | 'read' | 'readwrite'

export interface FilteredCapability {
  capability: CapabilitySummaryEntry
  /** True when the match came from an endpoint path rather than just the capability name. */
  matchedByPath: boolean
}

/** Local, in-memory filter for dense mode: matches capability name or any enabled endpoint path. */
export const filterCapabilities = (
  capabilities: CapabilitySummaryEntry[],
  query: string,
  levelFilter: CapabilityLevelFilter
): FilteredCapability[] => {
  const normalizedQuery = query.trim().toLowerCase()

  return capabilities
    .filter((capability) => levelFilter === 'all' || capability.mode === levelFilter)
    .flatMap((capability) => {
      if (normalizedQuery === '') return [{ capability, matchedByPath: false }]

      const nameMatches = capability.entry.name.toLowerCase().includes(normalizedQuery)
      const matchedByPath = capability.endpoints.some((endpoint) =>
        endpoint.path.toLowerCase().includes(normalizedQuery)
      )
      if (!nameMatches && !matchedByPath) return []
      return [{ capability, matchedByPath }]
    })
}

const RISK_RANK: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 }
const RANK_TO_RISK: Record<number, RiskLevel> = { 1: 'low', 2: 'medium', 3: 'high' }

/** One severity tier down, floored at 'low' — a read-only grant never outranks a read-write one. */
const downgradeRisk = (risk: RiskLevel): RiskLevel => RANK_TO_RISK[Math.max(1, RISK_RANK[risk] - 1)]

export interface RiskBannerResult {
  level: 'Minimal' | 'Low' | 'Medium' | 'High'
  tone: 'default' | 'low' | 'medium' | 'high'
  summary: string
}

/**
 * Computes the risk banner from the grant itself, never from a stored string. Severity is a max()
 * over every granted capability's catalog risk — downgraded a tier for read-only grants so a
 * read-only high-risk resource never outranks read-write on a medium one — then escalated for
 * account-wide tokens and resource bindings spanning many orgs/projects.
 */
export const computeRiskBanner = ({
  effectiveSelection,
  resourceAccess,
  organizationSlugs,
  projectRefs,
}: {
  effectiveSelection: PermissionSelection
  resourceAccess: ResourceAccessMode
  organizationSlugs: string[]
  projectRefs: string[]
}): RiskBannerResult => {
  const active = Object.entries(effectiveSelection).filter(([, mode]) => mode !== 'none')

  if (active.length === 0) {
    return { level: 'Minimal', tone: 'default', summary: 'No capabilities granted.' }
  }

  const readWriteCount = active.filter(([, mode]) => mode === 'readwrite').length
  const readCount = active.length - readWriteCount

  const maxRisk = active.reduce<RiskLevel>((max, [key, mode]) => {
    const entry = getCatalogEntry(key)
    if (!entry) return max
    const effectiveRisk: RiskLevel = mode === 'readwrite' ? entry.risk : downgradeRisk(entry.risk)
    return RISK_RANK[effectiveRisk] > RISK_RANK[max] ? effectiveRisk : max
  }, 'low')

  let rank = RISK_RANK[maxRisk]
  if (resourceAccess === 'account') {
    rank = Math.max(rank, RISK_RANK.medium) + (readWriteCount > 0 ? 1 : 0)
  } else if (resourceAccess === 'organization' && organizationSlugs.length > 3) {
    rank += 1
  } else if (resourceAccess === 'project' && projectRefs.length > 5) {
    rank += 1
  }
  rank = Math.min(rank, RISK_RANK.high)

  const level = rank === RISK_RANK.high ? 'High' : rank === RISK_RANK.medium ? 'Medium' : 'Low'
  const tone = rank === RISK_RANK.high ? 'high' : rank === RISK_RANK.medium ? 'medium' : 'low'

  const resourceNoun = resourceAccess === 'organization' ? 'organization' : 'project'
  const boundCount =
    resourceAccess === 'organization' ? organizationSlugs.length : projectRefs.length
  const scopeText =
    resourceAccess === 'account'
      ? 'across your entire account'
      : boundCount === 0
        ? `with no ${resourceNoun}s bound`
        : `across ${boundCount} ${pluralize(boundCount, resourceNoun)}`

  const segments: string[] = []
  if (readWriteCount > 0) {
    segments.push(
      `read-write on ${readWriteCount} ${pluralize(readWriteCount, 'capability', 'capabilities')}`
    )
  }
  if (readCount > 0) {
    segments.push(
      segments.length === 0
        ? `read on ${readCount} ${pluralize(readCount, 'capability', 'capabilities')}`
        : `read on ${readCount}`
    )
  }
  const sentence = `${segments.join(', ')}, ${scopeText}.`

  return { level, tone, summary: sentence.charAt(0).toUpperCase() + sentence.slice(1) }
}
