import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Link from 'next/link'

import { useIncidentStatusQuery } from 'data/platform/incident-status-query'
import {
  allIncidentsHaveSameStatus,
  getMostRecentIncident,
  getOverallStatus,
} from 'data/platform/incident-status-utils'
import { ExternalLink } from 'lucide-react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

dayjs.extend(relativeTime)

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
  const statusDescriptionSignOff = 'Please follow the status page for updates.'

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
