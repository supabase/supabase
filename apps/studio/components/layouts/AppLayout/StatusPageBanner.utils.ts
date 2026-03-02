import type { IncidentCache } from 'lib/api/incident-status'

type BannerIncident = { id: string; cache?: IncidentCache | null }

/**
 * Determines whether the incident status banner should be shown to a given user,
 * given all active incidents and the user's project state.
 *
 * Returns true if any incident matches the user's context.
 *
 * @param incidents - Active incidents from the incident-status endpoint
 * @param hasProjects - Whether the user has any projects at all
 * @param userRegions - Deduplicated set of regions of all databases (primary and read replicas) owned by the user
 * @param hasUnknownRegions - True when region data is incomplete (org has >100 projects).
 *   When true, the region check is skipped and a match is assumed.
 */
export function shouldShowBanner({
  incidents,
  hasProjects,
  userRegions,
  hasUnknownRegions = false,
}: {
  incidents: Array<BannerIncident>
  hasProjects: boolean
  userRegions: Set<string>
  hasUnknownRegions?: boolean
}): boolean {
  return incidents.some((incident) => {
    const affectedRegions = incident.cache?.affected_regions ?? []
    const affectsProjectCreation = incident.cache?.affects_project_creation ?? false

    // Users with no projects only see the banner if the incident affects project creation
    if (!hasProjects) return affectsProjectCreation

    // User has projects: if no region restriction, always show
    if (affectedRegions.length === 0) return true

    // Region data is incomplete — assume the user has a database in an affected region
    if (hasUnknownRegions) return true

    // Region restriction: only show if the user has a database in an affected region
    return affectedRegions.some((region) => userRegions.has(region))
  })
}

/**
 * Returns the IDs of incidents that are relevant to the given user.
 *
 * An incident is considered relevant if it would trigger banner visibility for
 * the user, per the same logic as shouldShowBanner.
 */
export function getRelevantIncidentIds({
  incidents,
  hasProjects,
  userRegions,
  hasUnknownRegions = false,
}: {
  incidents: Array<BannerIncident>
  hasProjects: boolean
  userRegions: Set<string>
  hasUnknownRegions?: boolean
}): Array<string> {
  return incidents
    .filter((incident) =>
      shouldShowBanner({ incidents: [incident], hasProjects, userRegions, hasUnknownRegions })
    )
    .map((incident) => incident.id)
}
