import dayjs from 'dayjs'

import type { IncidentInfo } from './incident-status-query'

/**
 * Status priority order: higher priority = more urgent
 * Used to determine which incident's status should be displayed
 */
const STATUS_PRIORITY: Record<string, number> = {
  investigating: 4,
  identified: 3,
  monitoring: 2,
  resolved: 1,
}

/**
 * Determines the most representative status when multiple incidents exist.
 * Returns the highest priority status (most urgent) among all incidents.
 *
 * @param incidents Array of incidents to analyze
 * @returns The highest priority status string
 */
export function getOverallStatus(incidents: Array<{ status: string }>): string {
  if (incidents.length === 0) return 'investigating'
  if (incidents.length === 1) return incidents[0].status

  // Find the highest priority status among all incidents
  const statuses = incidents.map((inc) => inc.status)
  const sortedByPriority = statuses.sort(
    (a, b) => (STATUS_PRIORITY[b] || 0) - (STATUS_PRIORITY[a] || 0)
  )

  return sortedByPriority[0] || 'investigating'
}

/**
 * Gets the most recent incident (by active_since) for display purposes.
 * This is used for the title/name, not for status determination.
 *
 * @param incidents Array of incidents to analyze
 * @returns The most recent incident, or null if array is empty
 */
export function getMostRecentIncident(incidents: Array<{ name: string; active_since: string }>): {
  name: string
  active_since: string
} | null {
  if (incidents.length === 0) {
    return null
  }
  if (incidents.length === 1) return incidents[0]

  // Sort by active_since descending (most recent first)
  const sorted = [...incidents].sort((a, b) => {
    const dateA = dayjs(a.active_since)
    const dateB = dayjs(b.active_since)
    return dateB.isBefore(dateA) ? -1 : dateB.isAfter(dateA) ? 1 : 0
  })

  return sorted[0]
}

/**
 * Checks if all incidents have the same status
 *
 * @param incidents Array of incidents to check
 * @returns true if all incidents share the same status
 */
export function allIncidentsHaveSameStatus(incidents: Array<{ status: string }>): boolean {
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
      mostRecentIncident: null,
      overallStatus: 'investigating' as const,
      allSameStatus: true,
    }
  }

  const hasMultipleIncidents = incidents.length > 1
  const mostRecentIncident = getMostRecentIncident(incidents)
  const overallStatus = getOverallStatus(incidents)
  const allSameStatus = allIncidentsHaveSameStatus(incidents)

  return {
    hasMultipleIncidents,
    mostRecentIncident,
    overallStatus,
    allSameStatus,
  }
}
