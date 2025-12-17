import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Link from 'next/link'

import { useIncidentStatusQuery } from 'data/platform/incident-status-query'
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

  // Show the most recent incident (or all if there's only one)
  const primaryIncident = incidents[0]
  const hasMultipleIncidents = incidents.length > 1

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

  // Create title
  const statusTitle =
    primaryIncident.name +
    (hasMultipleIncidents && incidents.length > 1
      ? ` and ${incidents.length - 1} other issue${incidents.length > 2 ? 's' : ''}`
      : '')

  // Create descriptions
  const statusDescriptionSignOff = 'Please check back soon or follow the status page for updates.'
  const investigatingStatusDescription = `We are investigating ${hasMultipleIncidents ? 'these issues' : 'this issue'}. ${statusDescriptionSignOff}`

  const getStatusDescription = (status: string): string => {
    switch (status) {
      case 'investigating':
        return investigatingStatusDescription
      case 'identified':
        return `We have identified the cause of ${hasMultipleIncidents ? 'these issues' : 'this issue'} and are working on a fix. ${statusDescriptionSignOff}`
      case 'monitoring':
        return `A fix has been deployed and we are monitoring the results. ${statusDescriptionSignOff}`
      case 'resolved':
        return `${hasMultipleIncidents ? 'These issues' : 'This issue'} have just been resolved but may take some time to fully recover. ${statusDescriptionSignOff}`
      default:
        return investigatingStatusDescription
    }
  }

  return (
    <Admonition
      type="warning"
      layout="horizontal"
      title={statusTitle}
      description={getStatusDescription(primaryIncident.status)}
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
