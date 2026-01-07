import type { IncidentInfo } from 'lib/api/incident-status'

export type IncidentImpact = 'critical' | 'major' | 'maintenance' | 'minor' | 'none'

/**
 * Impact priority order: higher priority = more severe
 */
const IMPACT_PRIORITY: Record<IncidentImpact, number> = {
  critical: 4,
  major: 3,
  maintenance: 2,
  minor: 1,
  none: 0,
}

const isIncidentImpact = (impact: string): impact is IncidentImpact => {
  return Object.keys(IMPACT_PRIORITY).includes(impact)
}

export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved'

/**
 * Status priority order: higher priority = more urgent
 */
const STATUS_PRIORITY: Record<IncidentStatus, number> = {
  investigating: 4,
  identified: 3,
  monitoring: 2,
  resolved: 1,
}

const isIncidentStatus = (status: string): status is IncidentStatus => {
  return Object.keys(STATUS_PRIORITY).includes(status)
}

/**
 * Sorts incidents by priority: first by impact, then by date, then by status.
 *
 * @param incidents Array of incidents to sort
 * @returns New array of incidents sorted by priority
 */
function sortIncidentsByPriority(incidents: Array<IncidentInfo>): Array<IncidentInfo> {
  const incidentsCopy = [...incidents]

  incidentsCopy.sort((a, b) => {
    const impactA = isIncidentImpact(a.impact) ? a.impact : 'none'
    const impactB = isIncidentImpact(b.impact) ? b.impact : 'none'
    const impactPriorityA = IMPACT_PRIORITY[impactA]
    const impactPriorityB = IMPACT_PRIORITY[impactB]

    const dateA = new Date(a.active_since).getTime()
    const dateB = new Date(b.active_since).getTime()
    const hasDifferentDates = Number.isFinite(dateA) && Number.isFinite(dateB) && dateB !== dateA

    const statusA = isIncidentStatus(a.status) ? a.status : 'investigating'
    const statusB = isIncidentStatus(b.status) ? b.status : 'investigating'
    const statusPriorityA = STATUS_PRIORITY[statusA]
    const statusPriorityB = STATUS_PRIORITY[statusB]

    if (impactPriorityB !== impactPriorityA) {
      return impactPriorityB - impactPriorityA
    } else if (hasDifferentDates) {
      return dateB - dateA
    } else {
      return statusPriorityB - statusPriorityA
    }
  })

  return incidentsCopy
}

/**
 * Checks if all incidents have the same status
 *
 * @param incidents Array of incidents to check
 * @returns true if all incidents share the same status
 */
function allIncidentsHaveSameStatus(incidents: Array<{ status: string }>): boolean {
  if (incidents.length <= 1) return true
  const firstStatus = incidents[0].status
  return incidents.every((inc) => inc.status === firstStatus)
}

/**
 * Processes incident data to extract useful metadata for display
 */
export function processIncidentData(incidents: IncidentInfo[]) {
  if (incidents.length === 0) {
    return {
      hasMultipleIncidents: false,
      mostCriticalIncident: null,
      overallStatus: 'investigating' as const,
      allSameStatus: true,
    }
  }

  const hasMultipleIncidents = incidents.length > 1
  const mostCriticalIncident = sortIncidentsByPriority(incidents)[0]
  const overallStatus = isIncidentStatus(mostCriticalIncident.status)
    ? mostCriticalIncident.status
    : 'investigating'
  const allSameStatus = allIncidentsHaveSameStatus(incidents)

  return {
    hasMultipleIncidents,
    mostCriticalIncident,
    overallStatus,
    allSameStatus,
  }
}
