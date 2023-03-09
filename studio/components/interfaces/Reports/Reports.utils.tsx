import { useStore } from 'hooks'
import useDbQuery from 'hooks/analytics/useDbQuery'
import useLogsQuery, { LogsQueryData, LogsQueryHandlers } from 'hooks/analytics/useLogsQuery'
import {
  BaseQueries,
  DbQueryData,
  DbQueryHandler,
  PresetConfig,
  ReportQuery,
} from './Reports.types'

/**
 * Converts a query params string to an object
 */
export const queryParamsToObject = (params: string) => {
  return Object.fromEntries(new URLSearchParams(params))
}

// generate hooks based on preset config
type PresetHookResult = [LogsQueryData | DbQueryData, LogsQueryHandlers | DbQueryHandler]
type PresetHooks = Record<keyof PresetConfig['queries'], () => PresetHookResult>

export const queriesFactory = <T extends string>(queries: BaseQueries<T>): PresetHooks => {
  const { ui } = useStore()
  const projectRef = ui.selectedProject?.ref ?? 'default'

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
