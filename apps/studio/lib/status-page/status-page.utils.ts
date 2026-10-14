import type { AffectedComponent, StatusPageResponse, WorstImpact } from './status-page.schema'

export const PROJECT_CREATION_GROUP_NAME = 'project creation'
export const DASHBOARD_COMPONENT_NAME = 'dashboard'

// Pattern, not a hardcoded region list, so new or test regions (e.g. a new AWS region, or a
// staging-only region) are recognized without a code change.
const REGION_CODE_PATTERN = /^[a-z]{2}(-[a-z]+)+-\d+$/

export const IMPACT_RANK: Record<WorstImpact, number> = {
  full_outage: 3,
  partial_outage: 2,
  degraded_performance: 1,
}

export const DEFAULT_UPCOMING_LEAD_DAYS = 7

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase()
}

export function normalizeRegion(region: string): string {
  return normalizeLabel(region)
}

export function isRegionCode(name: string): boolean {
  return REGION_CODE_PATTERN.test(normalizeRegion(name))
}

export function isProjectCreationComponent(component: AffectedComponent): boolean {
  return normalizeLabel(component.group_name ?? '') === PROJECT_CREATION_GROUP_NAME
}

export function isDashboardComponent(component: AffectedComponent): boolean {
  return (
    normalizeLabel(component.name) === DASHBOARD_COMPONENT_NAME ||
    normalizeLabel(component.group_name ?? '') === DASHBOARD_COMPONENT_NAME
  )
}

export type RegionScope = { type: 'global' } | { type: 'regions'; regions: ReadonlyArray<string> }

export function getRegionScope(components: ReadonlyArray<AffectedComponent>): RegionScope {
  if (components.length > 0 && components.every((component) => isRegionCode(component.name))) {
    return {
      type: 'regions',
      regions: components.map((component) => normalizeRegion(component.name)),
    }
  }
  return { type: 'global' }
}

export function isProjectCreationOnly(components: ReadonlyArray<AffectedComponent>): boolean {
  return components.length > 0 && components.every(isProjectCreationComponent)
}

type StatusItemBase = {
  id: string
  name: string
  url: string
  lastUpdateAt: string
  lastUpdateMessage: string | null
  components: ReadonlyArray<AffectedComponent>
  /** Scope derived from the components that aren't Project Creation. */
  scope: RegionScope
  /** Scope derived from Project Creation components; null when none affect creation. */
  projectCreationScope: RegionScope | null
  isProjectCreationOnly: boolean
  showBanner: boolean
}

export type StatusItem =
  | (StatusItemBase & {
      kind: 'incident'
      status: 'investigating' | 'identified' | 'monitoring'
      impact: WorstImpact
    })
  | (StatusItemBase & { kind: 'maintenance'; startedAt: string; scheduledEndAt: string | null })
  | (StatusItemBase & {
      kind: 'upcoming_maintenance'
      startsAt: string | null
      endsAt: string | null
      leadDays: number
    })

export type NormalizedStatusPage = { pageUrl: string; items: Array<StatusItem> }

type WidgetItemCommon = {
  id: string
  name: string
  url: string
  last_update_at: string
  last_update_message?: string | null
  affected_components: Array<AffectedComponent>
  visible: boolean
  show_banner: boolean
}

function buildBase(item: WidgetItemCommon): StatusItemBase {
  const nonCreationComponents = item.affected_components.filter(
    (component) => !isProjectCreationComponent(component)
  )
  const creationComponents = item.affected_components.filter(isProjectCreationComponent)

  return {
    id: item.id,
    name: item.name,
    url: item.url,
    lastUpdateAt: item.last_update_at,
    lastUpdateMessage: item.last_update_message ?? null,
    components: item.affected_components,
    scope: getRegionScope(nonCreationComponents),
    projectCreationScope: creationComponents.length > 0 ? getRegionScope(creationComponents) : null,
    isProjectCreationOnly: isProjectCreationOnly(item.affected_components),
    showBanner: item.show_banner,
  }
}

export function normalizeStatusPage(res: StatusPageResponse): NormalizedStatusPage {
  const items: Array<StatusItem> = [
    ...res.ongoing_incidents
      .filter((incident) => incident.visible)
      .map(
        (incident): StatusItem => ({
          ...buildBase(incident),
          kind: 'incident',
          status: incident.status,
          impact: incident.current_worst_impact,
        })
      ),
    ...res.in_progress_maintenances
      .filter((maintenance) => maintenance.visible)
      .map(
        (maintenance): StatusItem => ({
          ...buildBase(maintenance),
          kind: 'maintenance',
          startedAt: maintenance.started_at,
          scheduledEndAt: maintenance.scheduled_end_at ?? null,
        })
      ),
    ...res.scheduled_maintenances
      .filter((maintenance) => maintenance.visible)
      .map(
        (maintenance): StatusItem => ({
          ...buildBase(maintenance),
          kind: 'upcoming_maintenance',
          startsAt: maintenance.starts_at ?? null,
          endsAt: maintenance.ends_at ?? null,
          leadDays: maintenance.banner_lead_days ?? DEFAULT_UPCOMING_LEAD_DAYS,
        })
      ),
  ]

  return { pageUrl: res.page_url, items }
}

export function getDismissalKey(item: Pick<StatusItem, 'kind' | 'id'>): string {
  return `${item.kind}:${item.id}`
}

export type UserRegionContext = {
  hasProjects: boolean
  regions: ReadonlySet<string>
  isComplete: boolean
}

export function isRelevantToUser(item: StatusItem, user: UserRegionContext): boolean {
  if (!user.hasProjects) return false
  if (item.scope.type === 'global') return true
  if (!user.isComplete) return true

  const userRegions = new Set(Array.from(user.regions, normalizeRegion))
  return item.scope.regions.some((region) => userRegions.has(normalizeRegion(region)))
}

/**
 * Relevance check for signed-out surfaces (e.g. the sign-in page), where there's no
 * project/region context to match against.
 */
export function isRelevantToSignedOutUser(item: StatusItem): boolean {
  return item.components.some(isDashboardComponent)
}
