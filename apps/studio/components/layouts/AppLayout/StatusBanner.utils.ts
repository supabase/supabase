import {
  getDismissalKey,
  isRelevantToSignedOutUser,
  isRelevantToUser,
  type StatusItem,
  type UserRegionContext,
} from '@/lib/status-page/status-page.utils'

export type IncidentItem = Extract<StatusItem, { kind: 'incident' }>
export type MaintenanceItem = Extract<StatusItem, { kind: 'maintenance' }>
export type UpcomingMaintenanceItem = Extract<StatusItem, { kind: 'upcoming_maintenance' }>

export type BannerSelection =
  | { kind: 'incident'; items: Array<IncidentItem> }
  | { kind: 'maintenance'; item: MaintenanceItem }
  | { kind: 'upcoming_maintenance'; item: UpcomingMaintenanceItem }

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * True once the maintenance is close enough to start (within its lead time) and
 * hasn't already ended. `startsAt`/`endsAt` can be null when the upstream data is
 * incomplete; treat that as outside the window rather than guessing a date.
 */
export function isWithinUpcomingWindow(item: UpcomingMaintenanceItem, nowMs: number): boolean {
  if (item.startsAt === null || item.endsAt === null) return false

  const startsAtMs = new Date(item.startsAt).getTime()
  const endsAtMs = new Date(item.endsAt).getTime()
  if (Number.isNaN(startsAtMs) || Number.isNaN(endsAtMs)) return false

  const leadMs = item.leadDays * DAY_MS
  return startsAtMs - nowMs <= leadMs && endsAtMs > nowMs
}

function getUpcomingStartMs(item: UpcomingMaintenanceItem): number {
  return item.startsAt !== null ? new Date(item.startsAt).getTime() : Infinity
}

function earliestBy<T>(items: ReadonlyArray<T>, getTimeMs: (item: T) => number): T {
  return items.reduce((earliest, item) => (getTimeMs(item) < getTimeMs(earliest) ? item : earliest))
}

/**
 * Picks the single highest-priority banner to show, or null when nothing qualifies.
 * Priority: incident (all relevant, undismissed incidents together) > in-progress
 * maintenance (earliest start) > upcoming maintenance (soonest start).
 */
export function selectBanner(args: {
  items: Array<StatusItem>
  /** Pass null for signed-out surfaces, which have no project/region context to match against. */
  user: UserRegionContext | null
  dismissedKeys: ReadonlySet<string>
  nowMs: number
}): BannerSelection | null {
  const { items, user, dismissedKeys, nowMs } = args

  const eligible = items.filter(
    (item) =>
      item.showBanner &&
      !item.isProjectCreationOnly &&
      (user === null ? isRelevantToSignedOutUser(item) : isRelevantToUser(item, user))
  )

  const withinWindow = eligible.filter(
    (item) => item.kind !== 'upcoming_maintenance' || isWithinUpcomingWindow(item, nowMs)
  )

  const undismissed = withinWindow.filter((item) => !dismissedKeys.has(getDismissalKey(item)))

  const incidents = undismissed.filter((item): item is IncidentItem => item.kind === 'incident')
  if (incidents.length > 0) return { kind: 'incident', items: incidents }

  const maintenances = undismissed.filter(
    (item): item is MaintenanceItem => item.kind === 'maintenance'
  )
  if (maintenances.length > 0) {
    return {
      kind: 'maintenance',
      item: earliestBy(maintenances, (item) => new Date(item.startedAt).getTime()),
    }
  }

  const upcoming = undismissed.filter(
    (item): item is UpcomingMaintenanceItem => item.kind === 'upcoming_maintenance'
  )
  if (upcoming.length > 0) {
    return { kind: 'upcoming_maintenance', item: earliestBy(upcoming, getUpcomingStartMs) }
  }

  return null
}

export function getKeysToDismiss(selection: BannerSelection): Array<string> {
  if (selection.kind === 'incident') return selection.items.map(getDismissalKey)
  return [getDismissalKey(selection.item)]
}

/**
 * Drops dismissed keys for items that are no longer in the (unfiltered) current
 * item list — a finished incident or maintenance can't be re-dismissed, so there's
 * no reason to keep growing the list forever — then adds the newly dismissed keys.
 */
export function pruneDismissedKeys(params: {
  prev: Array<string>
  allItems: Array<StatusItem>
  add: Array<string>
}): Array<string> {
  const { prev, allItems, add } = params
  const activeKeys = new Set(allItems.map(getDismissalKey))
  const kept = prev.filter((key) => activeKeys.has(key))
  return Array.from(new Set([...kept, ...add]))
}

export function getBannerCopy(selection: BannerSelection): { title: string; description: string } {
  switch (selection.kind) {
    case 'incident': {
      const title =
        selection.items.length > 1
          ? 'We are investigating multiple technical issues'
          : 'We are investigating a technical issue'
      return { title, description: '' }
    }
    case 'maintenance': {
      const { scheduledEndAt } = selection.item
      const hasFutureEnd =
        scheduledEndAt !== null && new Date(scheduledEndAt).getTime() > Date.now()
      return {
        title: 'Scheduled maintenance in progress',
        description: hasFutureEnd
          ? 'Some services may be temporarily unavailable until maintenance ends'
          : 'Some services may be temporarily unavailable',
      }
    }
    case 'upcoming_maintenance': {
      return {
        title: 'Upcoming scheduled maintenance',
        description: 'Some services may be temporarily unavailable during this window',
      }
    }
  }
}
