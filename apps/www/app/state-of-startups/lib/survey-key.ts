/**
 * Canonical survey key + filter types. Dependency-free on purpose: imported by
 * both the runtime data layer (survey-keys.ts) and the build-time generator
 * (scripts/generate-state-of-startups-data.ts), so a single definition keeps
 * generated keys and lookup keys byte-identical.
 */

export type Aggregation = 'single' | 'multi' | 'boolean'

/** A filter value is an exact match (string) or an IN-list (array of strings). */
export type FilterValue = string | readonly string[]
export type SurveyFilters = Record<string, FilterValue>

/** A single distribution lookup: which option(s) of which column/aggregation,
 *  optionally restricted by filters. Shared by stat cards, compare cards, and
 *  cross-tab series. */
export interface DistributionQuery {
  column: string
  aggregation: Aggregation
  target: string | string[]
  filters?: SurveyFilters
}

function filterToken(filters?: SurveyFilters): string {
  if (!filters) return ''
  const keys = Object.keys(filters).sort()
  if (keys.length === 0) return ''
  return JSON.stringify(keys.map((k) => [k, filters[k]]))
}

export function surveyKey(
  year: number,
  column: string,
  aggregation: Aggregation,
  filters?: SurveyFilters
): string {
  return `${year}|${column}|${aggregation}|${filterToken(filters)}`
}

/** Merges a base filter set with an extra cohort filter (the extra wins).
 *  Returns undefined when the result is empty so keys match the no-filter
 *  distributions. */
export function mergeFilters(
  base?: SurveyFilters,
  extra?: SurveyFilters
): SurveyFilters | undefined {
  const merged = { ...(base ?? {}), ...(extra ?? {}) }
  return Object.keys(merged).length > 0 ? merged : undefined
}
