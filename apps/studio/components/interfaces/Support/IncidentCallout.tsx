import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import Link from 'next/link'

import { useIncidentStatusQuery } from 'data/platform/incident-status-query'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

dayjs.extend(relativeTime)

export function IncidentCallout() {
  const { data: incidents, isPending, isError } = useIncidentStatusQuery()

  // Don't show anything while loading or on error
  if (isPending || isError || !incidents || incidents.length === 0) {
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

  return (
    <Admonition
      type="warning"
      title={hasMultipleIncidents ? 'Active incidents ongoing' : 'Active incident ongoing'}
      description={
        <div className="flex flex-col gap-y-3">
          <div className="flex flex-col gap-y-2">
            <p className="text-sm leading-normal">
              <strong>{primaryIncident.name}</strong>
            </p>
            {primaryIncident.status && (
              <p className="text-sm text-foreground-light">
                Status: {primaryIncident.status}
              </p>
            )}
            <p className="text-sm text-foreground-light">
              Active since: {formatActiveSince(primaryIncident.active_since)}
            </p>
            {hasMultipleIncidents && (
              <p className="text-sm text-foreground-light">
                {incidents.length - 1} other incident{incidents.length - 1 > 1 ? 's' : ''} ongoing
              </p>
            )}
          </div>
          <div>
            <Button asChild type="default">
              <Link href="https://status.supabase.com/" target="_blank" rel="noreferrer">
                View status page
              </Link>
            </Button>
          </div>
        </div>
      }
    />
  )
}

