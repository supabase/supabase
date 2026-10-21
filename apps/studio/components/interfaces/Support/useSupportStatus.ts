import { useQuery } from '@tanstack/react-query'
import { useFlag } from 'common'

import {
  DEFAULT_STATUS_PAGE_URL,
  getStatusDescription,
  getStatusPillLabel,
  getSupportAdmonitionCopy,
  prioritizeActiveItems,
  type SupportStatus,
} from './SupportStatus.utils'
import { useIncidentStatusQuery } from '@/data/platform/incident-status-query'
import { processIncidentData } from '@/data/platform/incident-status-utils'
import { statusPageQueryOptions } from '@/data/platform/status-page-query'
import { IS_PLATFORM } from '@/lib/constants'
import { normalizeStatusPage } from '@/lib/status-page/status-page.utils'

function getLegacyPillLabel(hasActiveIncidents: boolean, isMaintenance: boolean): string {
  if (hasActiveIncidents) return 'Active incident ongoing'
  if (isMaintenance) return 'Scheduled maintenance'
  return 'All systems operational'
}

export function useSupportStatus(): SupportStatus {
  const useNewStatusPage = useFlag('incidentIoStatusPage') === true

  const newStatusQuery = useQuery({
    ...statusPageQueryOptions(),
    select: normalizeStatusPage,
    enabled: useNewStatusPage && IS_PLATFORM,
  })

  const legacyQuery = useIncidentStatusQuery({ enabled: !useNewStatusPage })

  if (useNewStatusPage) {
    if (newStatusQuery.isPending) return { status: 'pending' }
    if (newStatusQuery.isError) return { status: 'error' }

    const { pageUrl, items } = newStatusQuery.data
    const activeItems = prioritizeActiveItems(items)

    return {
      status: 'success',
      hasActiveIncidents: activeItems.some((item) => item.kind === 'incident'),
      pillLabel: getStatusPillLabel(items),
      admonition: getSupportAdmonitionCopy(items),
      pageUrl,
    }
  }

  if (legacyQuery.isPending) return { status: 'pending' }
  if (legacyQuery.isError) return { status: 'error' }

  const { incidents = [], maintenanceEvents = [] } = legacyQuery.data ?? {}
  const hasActiveIncidents = incidents.length > 0
  const isMaintenance = maintenanceEvents.length > 0
  const { hasMultipleIncidents, mostCriticalIncident, overallStatus, allSameStatus } =
    processIncidentData(incidents)

  const admonitionTitle =
    (mostCriticalIncident?.name ?? '') +
    (hasMultipleIncidents
      ? ` and ${incidents.length - 1} other issue${incidents.length > 2 ? 's' : ''}`
      : '')

  return {
    status: 'success',
    hasActiveIncidents,
    pillLabel: getLegacyPillLabel(hasActiveIncidents, isMaintenance),
    admonition: hasActiveIncidents
      ? {
          title: admonitionTitle,
          description: getStatusDescription({
            status: overallStatus,
            hasMultipleIncidents,
            allSameStatus,
          }),
        }
      : null,
    pageUrl: DEFAULT_STATUS_PAGE_URL,
  }
}
