import { useIncidentStatusQuery } from 'data/platform/incident-status-query'
import { processIncidentData } from 'data/platform/incident-status-utils'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/admonition'

interface IncidentAdmonitionProps {
  isActive: boolean
}

const STATUS_DESCRIPTION_SIGN_OFF = 'Follow the status page for updates.'

const capitalizeFirstLetter = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

const getStatusDescription = (
  status: string,
  hasMultipleIncidents: boolean,
  allSameStatus: boolean
): string => {
  const isPlural = hasMultipleIncidents
  const issueTerm = isPlural ? 'these issues' : 'this issue'

  switch (status) {
    case 'investigating':
      if (hasMultipleIncidents && !allSameStatus) {
        return `We are aware of multiple ongoing issues and are investigating. ${STATUS_DESCRIPTION_SIGN_OFF}`
      }
      return `We are investigating ${issueTerm}. ${STATUS_DESCRIPTION_SIGN_OFF}`

    case 'identified':
      if (hasMultipleIncidents && !allSameStatus) {
        return `We have identified the cause of some of ${issueTerm} and are working on fixes. ${STATUS_DESCRIPTION_SIGN_OFF}`
      }
      return `We have identified the cause of ${issueTerm} and are working on a fix. ${STATUS_DESCRIPTION_SIGN_OFF}`

    case 'monitoring':
      if (hasMultipleIncidents && !allSameStatus) {
        return `Fixes have been deployed for some of ${issueTerm} and we are monitoring the results. ${STATUS_DESCRIPTION_SIGN_OFF}`
      }
      return `A fix has been deployed and we are monitoring the results. ${STATUS_DESCRIPTION_SIGN_OFF}`

    case 'resolved':
      if (hasMultipleIncidents && !allSameStatus) {
        return `Some of ${issueTerm} have been resolved, but others may still be ongoing. ${STATUS_DESCRIPTION_SIGN_OFF}`
      }
      return `${capitalizeFirstLetter(issueTerm)} ${isPlural ? 'have' : 'has'} been resolved but may take some time to fully recover. ${STATUS_DESCRIPTION_SIGN_OFF}`

    default:
      return `We are investigating ${issueTerm}. ${STATUS_DESCRIPTION_SIGN_OFF}`
  }
}

export function IncidentAdmonition({ isActive }: IncidentAdmonitionProps) {
  const { data: allStatusPageEvents, isLoading, isError } = useIncidentStatusQuery()
  const { incidents = [] } = allStatusPageEvents ?? {}

  // Don't render anything while loading, on error, or if no incidents
  if (isLoading || isError || !incidents || incidents.length === 0) {
    return null
  }

  const { hasMultipleIncidents, mostCriticalIncident, overallStatus, allSameStatus } =
    processIncidentData(incidents)

  // Show most recent incident name + count if multiple incidents
  const statusTitle =
    (mostCriticalIncident?.name ?? '') +
    (hasMultipleIncidents
      ? ` and ${incidents.length - 1} other issue${incidents.length > 2 ? 's' : ''}`
      : '')

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
            description={getStatusDescription(overallStatus, hasMultipleIncidents, allSameStatus)}
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
