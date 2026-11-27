import { IMPACT_RANK, type StatusItem } from '@/lib/status-page/status-page.utils'

export const DEFAULT_STATUS_PAGE_URL = 'https://status.supabase.com/'

const STATUS_DESCRIPTION_SIGN_OFF = 'Follow the status page for updates.'

function capitalizeFirstLetter(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/**
 * Describes the current state of one or more active issues. `status` covers incident statuses
 * plus the synthetic `maintenance_in_progress` status used for in-progress maintenance.
 */
export function getStatusDescription({
  status,
  hasMultipleIncidents,
  allSameStatus,
}: {
  status: string
  hasMultipleIncidents: boolean
  allSameStatus: boolean
}): string {
  const issueTerm = hasMultipleIncidents ? 'these issues' : 'this issue'

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
      return `${capitalizeFirstLetter(issueTerm)} ${hasMultipleIncidents ? 'have' : 'has'} been resolved but may take some time to fully recover. ${STATUS_DESCRIPTION_SIGN_OFF}`

    case 'maintenance_in_progress':
      if (hasMultipleIncidents && !allSameStatus) {
        return `Scheduled maintenance is in progress alongside other issues. ${STATUS_DESCRIPTION_SIGN_OFF}`
      }
      return `Scheduled maintenance is in progress. ${STATUS_DESCRIPTION_SIGN_OFF}`

    default:
      return `We are investigating ${issueTerm}. ${STATUS_DESCRIPTION_SIGN_OFF}`
  }
}

export type ActiveStatusItem = Extract<StatusItem, { kind: 'incident' | 'maintenance' }>

function getItemStatusLabel(item: ActiveStatusItem): string {
  return item.kind === 'incident' ? item.status : 'maintenance_in_progress'
}

/**
 * Incidents and in-progress maintenance only (never upcoming maintenance), ranked by impact
 * (maintenance ranks below every incident impact), then by recency. Ignores `showBanner`:
 * "Hide banner" only hides the global banner, not the support form's status pill/admonition.
 */
export function prioritizeActiveItems(items: Array<StatusItem>): Array<ActiveStatusItem> {
  const active = items.filter(
    (item): item is ActiveStatusItem => item.kind === 'incident' || item.kind === 'maintenance'
  )

  return active.sort((a, b) => {
    const rankA = a.kind === 'incident' ? IMPACT_RANK[a.impact] : 0
    const rankB = b.kind === 'incident' ? IMPACT_RANK[b.impact] : 0
    if (rankB !== rankA) return rankB - rankA
    return new Date(b.lastUpdateAt).getTime() - new Date(a.lastUpdateAt).getTime()
  })
}

export function getSupportAdmonitionCopy(
  items: Array<StatusItem>
): { title: string; description: string } | null {
  const active = prioritizeActiveItems(items)
  if (active.length === 0) return null

  const [top, ...rest] = active
  const hasMultipleIncidents = rest.length > 0
  const title = hasMultipleIncidents
    ? `${top.name} and ${rest.length} other issue${rest.length > 1 ? 's' : ''}`
    : top.name

  const topStatus = getItemStatusLabel(top)
  const allSameStatus = active.every((item) => getItemStatusLabel(item) === topStatus)

  return {
    title,
    description: getStatusDescription({ status: topStatus, hasMultipleIncidents, allSameStatus }),
  }
}

export function getStatusPillLabel(items: Array<StatusItem>): string {
  const active = prioritizeActiveItems(items)
  if (active.length === 0) return 'All systems operational'
  if (active.some((item) => item.kind === 'incident')) return 'Active incident ongoing'
  return 'Scheduled maintenance'
}

export type SupportStatus =
  | { status: 'pending' }
  | { status: 'error' }
  | {
      status: 'success'
      hasActiveIncidents: boolean
      pillLabel: string
      admonition: { title: string; description: string } | null
      pageUrl: string
    }

export function getSupportStatusLabel(status: SupportStatus): string {
  if (status.status === 'pending') return 'Checking status'
  if (status.status === 'error') return 'Failed to check status'
  return status.pillLabel
}
