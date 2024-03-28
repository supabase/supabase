import useDbQuery, { DbQueryHook } from 'hooks/analytics/useDbQuery'
import useLogsQuery, { LogsQueryHook } from 'hooks/analytics/useLogsQuery'
import type { BaseQueries, PresetConfig, ReportQuery } from './Reports.types'

/**
 * Converts a query params string to an object
 */
export const queryParamsToObject = (params: string) => {
  return Object.fromEntries(new URLSearchParams(params))
}

// generate hooks based on preset config
type PresetHookResult = LogsQueryHook | DbQueryHook
type PresetHooks = Record<keyof PresetConfig['queries'], () => PresetHookResult>

export const queriesFactory = <T extends string>(
  queries: BaseQueries<T>,
  projectRef: string
): PresetHooks => {
  const hooks: PresetHooks = Object.entries<ReportQuery>(queries).reduce(
    (acc, [k, { sql, queryType }]) => {
      if (queryType === 'db') {
        return {
          ...acc,
          [k]: () => useDbQuery(sql),
        }
      } else {
        return {
          ...acc,
          [k]: () => useLogsQuery(projectRef),
        }
      }
    },
    {}
  )
  return hooks
}

// [Terry] temp, not sure of the right way to determine actionable select queries
// for now grabbing select queries on public schema
export function isIndexSuggestionNeeded(query: string): boolean {
  // Convert the query to lowercase for case-insensitive matching
  const lowercaseQuery = query.toLowerCase()

  // Check if the query contains the SELECT keyword
  if (!lowercaseQuery.includes('select')) {
    return false
  }

  // Check for other clauses that typically indicate a SELECT query that may benefit from an index
  if (lowercaseQuery.includes('public.') || lowercaseQuery.includes('countries')) {
    // needs something that works for now
    return true
  }

  // If none of the clauses are found, assume the query selects all columns without any filtering
  return false
}
