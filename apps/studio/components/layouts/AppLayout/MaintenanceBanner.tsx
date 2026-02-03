import { LOCAL_STORAGE_KEYS } from 'common'
import { HeaderBanner } from 'components/interfaces/Organization/HeaderBanner'
import { InlineLink } from 'components/ui/InlineLink'

import { useIncidentStatusQuery } from '@/data/platform/incident-status-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

/**
 * Used to display ongoing maintenance
 */
export function MaintenanceBanner() {
  const { data: allStatusPageEvents } = useIncidentStatusQuery()
  const { maintenanceEvents = [] } = allStatusPageEvents ?? {}
  const currentEventId = maintenanceEvents[0]?.id ?? ''

  const [dismissed, setDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.MAINTENANCE_BANNER_DISMISSED(currentEventId),
    false
  )

  if (dismissed) return null

  return (
    <HeaderBanner
      variant="note"
      title="Scheduled maintenance is in progress"
      description={
        <>
          Follow the <InlineLink href="https://status.supabase.com">status page</InlineLink> for
          updates
        </>
      }
      onDismiss={() => setDismissed(true)}
    />
  )
}
