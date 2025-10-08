import dayjs from 'dayjs'

import useDbQuery, { DbQueryHook } from 'hooks/analytics/useDbQuery'
import useLogsQuery, { LogsQueryHook } from 'hooks/analytics/useLogsQuery'
import type { BaseQueries, PresetConfig, ReportQuery } from './Reports.types'

/**
 * Converts a query params string to an object
 */
export const queryParamsToObject = (params: string) => {
  return Object.fromEntries(new URLSearchParams(params))
}

export type PresetHookResult = LogsQueryHook | DbQueryHook
type PresetHooks = Record<keyof PresetConfig['queries'], () => PresetHookResult>
/**
 * @deprecated
 * Queries are hooks, avoid generating hooks dynamically
 * Generate fetch functions instead, and pass it to a hook inside the component
 */
export const queriesFactory = <T extends string>(
  queries: BaseQueries<T>,
  projectRef: string
): PresetHooks => {
  const hooks: PresetHooks = Object.entries<ReportQuery>(queries).reduce(
    (acc, [k, { sql, queryType }]) => {
      if (queryType === 'db') {
        return {
          ...acc,
          [k]: () => useDbQuery({ sql }),
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

/**
 * Formats a timestamp to a human readable format in UTC
 *
 * @param timestamp - The timestamp to format
 * @param returnUtc - Whether to return the timestamp in UTC
 * @param format - The format to use for the timestamp
 * @returns The formatted timestamp string
 */
export const formatTimestamp = (
  timestamp: number | string,
  { returnUtc = false, format = 'MMM D, h:mma' }: { returnUtc?: boolean; format?: string } = {}
) => {
  try {
    const isSeconds = String(timestamp).length === 10
    const isMicroseconds = String(timestamp).length === 16

    const timestampInMs = isSeconds
      ? Number(timestamp) * 1000
      : isMicroseconds
        ? Number(timestamp) / 1000
        : Number(timestamp)

    if (returnUtc) {
      return dayjs.utc(timestampInMs).format(format)
    } else {
      return dayjs(timestampInMs).format(format)
    }
  } catch (error) {
    console.error(error)
    return 'Invalid Date'
  }
}
