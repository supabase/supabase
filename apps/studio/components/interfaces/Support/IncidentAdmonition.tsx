import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Link from 'next/link'

import { useIncidentStatusQuery } from 'data/platform/incident-status-query'
import { ExternalLink } from 'lucide-react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

dayjs.extend(relativeTime)

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
 */
const getOverallStatus = (incidents: Array<{ status: string }>): string => {
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
 */
const getMostRecentIncident = (
  incidents: Array<{ name: string; active_since: string }>
): { name: string; active_since: string } => {
  if (incidents.length === 0) {
    throw new Error('Cannot get most recent incident from empty array')
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
 */
const allIncidentsHaveSameStatus = (incidents: Array<{ status: string }>): boolean => {
  if (incidents.length <= 1) return true
  const firstStatus = incidents[0].status
  return incidents.every((inc) => inc.status === firstStatus)
}

export function IncidentAdmonition() {
  const { data: incidents, isPending, isError, error } = useIncidentStatusQuery()

  // Debug logging
  if (typeof window !== 'undefined') {
    console.log('[IncidentAdmonition] State:', {
      isPending,
      isError,
      incidents,
      incidentsLength: incidents?.length,
      error,
    })
  }

  // Don't show anything while loading or on error
  if (isPending || isError || !incidents || incidents.length === 0) {
    if (typeof window !== 'undefined' && !isPending) {
      console.warn('[IncidentAdmonition] Not rendering:', {
        isPending,
        isError,
        hasIncidents: !!incidents,
        incidentsLength: incidents?.length,
      })
    }
    return null
  }

  const hasMultipleIncidents = incidents.length > 1
  const mostRecentIncident = getMostRecentIncident(incidents)
  const overallStatus = getOverallStatus(incidents)
  const allSameStatus = allIncidentsHaveSameStatus(incidents)

  const formatActiveSince = (activeSince: string) => {
    try {
      const date = dayjs(activeSince)
      const daysDiff = dayjs().diff(date, 'day')

      // If less than 1 day, show relative time (e.g., "2 hours ago")
      if (daysDiff < 1) {
        return date.fromNow()
      }

      // Otherwise show formatted date (e.g., "Jan 15, 2024 at 2:30 PM")
      return date.format('MMM D, YYYY [at] h:mm A')
    } catch {
      return activeSince
    }
  }

  // Create title - show most recent incident name + count if multiple
  const statusTitle =
    mostRecentIncident.name +
    (hasMultipleIncidents
      ? ` and ${incidents.length - 1} other issue${incidents.length > 2 ? 's' : ''}`
      : '')

  // Create descriptions based on overall status and whether all incidents share the same status
  const statusDescriptionSignOff = 'Please check back soon or follow the status page for updates.'

  const getStatusDescription = (status: string): string => {
    const isPlural = hasMultipleIncidents
    const issueTerm = isPlural ? 'these issues' : 'this issue'
    const issuesTerm = isPlural ? 'These issues' : 'This issue'

    switch (status) {
      case 'investigating':
        if (hasMultipleIncidents && !allSameStatus) {
          return `We are aware of multiple ongoing issues and are investigating. ${statusDescriptionSignOff}`
        }
        return `We are investigating ${issueTerm}. ${statusDescriptionSignOff}`

      case 'identified':
        if (hasMultipleIncidents && !allSameStatus) {
          return `We have identified the cause of some of ${isPlural ? 'these issues' : 'this issue'} and are working on fixes. ${statusDescriptionSignOff}`
        }
        return `We have identified the cause of ${issueTerm} and are working on a fix. ${statusDescriptionSignOff}`

      case 'monitoring':
        if (hasMultipleIncidents && !allSameStatus) {
          return `Fixes have been deployed for some of ${isPlural ? 'these issues' : 'this issue'} and we are monitoring the results. ${statusDescriptionSignOff}`
        }
        return `A fix has been deployed and we are monitoring the results. ${statusDescriptionSignOff}`

      case 'resolved':
        if (hasMultipleIncidents && !allSameStatus) {
          return `Some of ${isPlural ? 'these issues' : 'this issue'} have been resolved, but others may still be ongoing. ${statusDescriptionSignOff}`
        }
        return `${issuesTerm} ${isPlural ? 'have' : 'has'} been resolved but may take some time to fully recover. ${statusDescriptionSignOff}`

      default:
        return `We are investigating ${issueTerm}. ${statusDescriptionSignOff}`
    }
  }

  return (
    <Admonition
      type="warning"
      layout="horizontal"
      title={statusTitle}
      description={getStatusDescription(overallStatus)}
      actions={
        <Button asChild type="default" icon={<ExternalLink strokeWidth={1.5} />}>
          <Link href="https://status.supabase.com/" target="_blank" rel="noreferrer">
            Status page
          </Link>
        </Button>
      }
    />
  )
}
