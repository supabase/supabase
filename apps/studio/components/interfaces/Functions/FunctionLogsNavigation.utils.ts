import { getFunctionLogsDateRange } from './EdgeFunctionOverview/EdgeFunctionOverview.utils'
import { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { parseLogsFilterUrlParams } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.filters'
import { serializeUnifiedLogsSearchParams } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.utils'

export function getFunctionLogsMigrationUrl({
  projectRef,
  functionSlug,
  searchParams,
  usesOtelLegacyLogs = false,
}: {
  projectRef: string
  functionSlug: string
  searchParams: URLSearchParams
  usesOtelLegacyLogs?: boolean
}): string | null {
  const params = new URLSearchParams(searchParams)
  const unifiedFilters = SEARCH_PARAMS_PARSER.filter.parse(params.get('filter') ?? '') ?? []
  const validFilters = unifiedFilters.filter(
    (filter) => parseLogsFilterUrlParams([filter]).length > 0
  )
  const filters = [...validFilters]

  if (filters.length === 0) {
    let legacyFilters: unknown = {}
    try {
      legacyFilters = JSON.parse(params.get('f') || '{}')
    } catch {
      return null
    }
    if (
      typeof legacyFilters !== 'object' ||
      legacyFilters === null ||
      Array.isArray(legacyFilters)
    ) {
      return null
    }
    const activeFilters = Object.entries(legacyFilters).filter(([, value]) => value !== false)
    if (activeFilters.some(([key]) => key !== 'search_query')) return null
    const legacySearch =
      params.get('s') || activeFilters.find(([key]) => key === 'search_query')?.[1]
    if (legacySearch !== undefined && typeof legacySearch !== 'string') return null
    if (legacySearch) {
      if (!usesOtelLegacyLogs) return null
      if (/[\\^$.*+?()[\]{}|%_]/.test(legacySearch)) return null
      filters.push(`event_message:ilike:${legacySearch}`)
    }
  }

  const unifiedDate = SEARCH_PARAMS_PARSER.date.parse(params.get('date') ?? '')
  let date: Date[] | null = null
  if (unifiedDate?.length === 2 && unifiedDate.every((value) => Number.isFinite(value.getTime()))) {
    date = getFunctionLogsDateRange(unifiedDate[0].toISOString(), unifiedDate[1].toISOString())
  }
  const start = params.get('its') || undefined
  const end = params.get('ite') || undefined
  const partialRange = start || end
  const hasValidPartialRange =
    Boolean(start) !== Boolean(end) &&
    !!partialRange &&
    Number.isFinite(new Date(partialRange).getTime())
  if (!date && hasValidPartialRange) return null
  date ??= getFunctionLogsDateRange(start, end)
  const id = params.get('id') || params.get('log') || null
  for (const key of ['its', 'ite', 'log', 's', 'f']) params.delete(key)
  const query = params.toString()
  const base = `/project/${projectRef}/functions/${functionSlug}/logs${query ? `?${query}` : ''}`
  return serializeUnifiedLogsSearchParams(base, {
    date,
    id,
    filter: filters.length ? filters : null,
  })
}
