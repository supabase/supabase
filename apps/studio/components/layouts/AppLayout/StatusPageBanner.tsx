import { LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { HeaderBanner } from 'components/interfaces/Organization/HeaderBanner'
import { InlineLink } from 'components/ui/InlineLink'
import { IS_TEST_ENV } from 'lib/constants'

import { useIncidentStatusQuery } from '@/data/platform/incident-status-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const TEST_INCIDENT_OVERRIDE_KEY = 'e2e-incident-banner-override'

const BANNER_DESCRIPTION = (
  <>
    Follow the <InlineLink href="https://status.supabase.com">status page</InlineLink> for updates
  </>
)

/**
 * Used to display ongoing incidents or maintenances
 */
export const StatusPageBanner = () => {
  const { data: allStatusPageEvents } = useIncidentStatusQuery()
  const { incidents = [], maintenanceEvents = [] } = allStatusPageEvents ?? {}

  // Only show incident banner for incidents with real impact (not "none")
  const highImpactIncident = incidents.find((incident) => incident.impact !== 'none')
  const incidentEventId = highImpactIncident?.id ?? ''
  // In test environments, allow simulating the override via localStorage
  const testOverride =
    IS_TEST_ENV && typeof window !== 'undefined'
      ? localStorage.getItem(TEST_INCIDENT_OVERRIDE_KEY) === 'true'
      : false

  const showIncidentBannerOverride =
    useFlag('ongoingIncident') || process.env.NEXT_PUBLIC_ONGOING_INCIDENT === 'true' || testOverride

  const ongoingMaintenance = maintenanceEvents.length > 0
  const maintenanceEventId = maintenanceEvents[0]?.id ?? ''

  const [dismissedIncident, setDismissedIncident] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.INCIDENT_BANNER_DISMISSED(incidentEventId),
    false
  )

  const [dismissedMaintenance, setDismissedMaintenance] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.MAINTENANCE_BANNER_DISMISSED(maintenanceEventId),
    false
  )

  if (showIncidentBannerOverride || (highImpactIncident && !dismissedIncident)) {
    return (
      <HeaderBanner
        variant="warning"
        title="We are investigating a technical issue"
        description={BANNER_DESCRIPTION}
        onDismiss={
          showIncidentBannerOverride || !highImpactIncident
            ? undefined
            : () => setDismissedIncident(true)
        }
      />
    )
  }

  if (ongoingMaintenance && !dismissedMaintenance) {
    return (
      <HeaderBanner
        variant="note"
        title="Scheduled maintenance is in progress"
        description={BANNER_DESCRIPTION}
        onDismiss={() => setDismissedMaintenance(true)}
      />
    )
  }

  return null
}
