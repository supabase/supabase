import useDbQuery, { DbQueryHook } from 'hooks/analytics/useDbQuery'
import useLogsQuery, { LogsQueryHook } from 'hooks/analytics/useLogsQuery'
import { BaseQueries, PresetConfig, ReportQuery } from './Reports.types'

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
