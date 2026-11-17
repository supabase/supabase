import {
  logsFiltersToUrlParams,
  type LogsFilter,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.filters'
import {
  serializeUnifiedLogsSearchParams,
  type UnifiedLogType,
} from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'

/**
 * A named set of Logs filters. Opening one puts its filters in the filter bar, where they can be
 * changed like any others. Saved views (`LogsView`) can join the list later through `applyView`,
 * which yields the same URL filters.
 */
export type ExplorerLogsView = {
  id: string
  name: string
  filters: readonly LogsFilter[]
  /** The log type whose icon stands for the view in the sidebar. */
  iconLogType?: UnifiedLogType
}

const logTypeView = (
  id: string,
  name: string,
  logTypes: readonly [UnifiedLogType, ...UnifiedLogType[]]
): ExplorerLogsView => ({
  id,
  name,
  filters: logTypes.map((logType) => ({ column: 'log_type', operator: '=', value: logType })),
  iconLogType: logTypes[0],
})

/** The predefined views, in sidebar order. */
export const EXPLORER_LOGS_VIEWS: readonly ExplorerLogsView[] = [
  { id: 'all', name: 'All logs', filters: [] },
  { id: 'errors', name: 'Errors', filters: [{ column: 'level', operator: '=', value: 'error' }] },
  logTypeView('postgres', 'Postgres', ['postgres']),
  logTypeView('postgrest', 'PostgREST', ['postgrest']),
  logTypeView('auth', 'Auth', ['auth']),
  logTypeView('storage', 'Storage', ['storage']),
  logTypeView('realtime', 'Realtime', ['realtime']),
  // Invocations and runtime logs together, as on a function's own Logs tab.
  logTypeView('edge-functions', 'Edge Functions', ['edge function', 'edge function runtime']),
]

/** Where the Logs tab opens with the view's filters applied. */
export const getLogsViewHref = (projectRef: string, view: ExplorerLogsView) =>
  serializeUnifiedLogsSearchParams(`/project/${projectRef}/explorer/logs`, {
    filter: view.filters.length > 0 ? logsFiltersToUrlParams([...view.filters]) : null,
  })

/**
 * Whether the URL's filters are exactly the view's, in any order. Once someone changes them, no
 * view is current, the same as a modified saved view on the Logs page.
 */
export const isLogsViewApplied = (view: ExplorerLogsView, urlFilters: readonly string[] | null) => {
  const viewFilters = new Set(logsFiltersToUrlParams([...view.filters]))
  const current = new Set(urlFilters ?? [])
  return viewFilters.size === current.size && [...viewFilters].every((f) => current.has(f))
}
