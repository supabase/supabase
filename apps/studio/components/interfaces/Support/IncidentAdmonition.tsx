import { AnimatePresence, motion } from 'framer-motion'
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

interface IncidentAdmonitionProps {
  isActive: boolean
}

export function IncidentAdmonition({ isActive }: IncidentAdmonitionProps) {
  const { data: incidents } = useIncidentStatusQuery()

  const hasMultipleIncidents = incidents && incidents.length > 1
  const mostRecentIncident = incidents ? getMostRecentIncident(incidents) : null
  const overallStatus = incidents ? getOverallStatus(incidents) : ''
  const allSameStatus = incidents ? allIncidentsHaveSameStatus(incidents) : false

  // Create title - show most recent incident name + count if multiple
  const statusTitle =
    (mostRecentIncident?.name ?? '') +
    (hasMultipleIncidents && incidents
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
    <AnimatePresence>
      {isActive && (
        <motion.aside
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
        >
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
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
