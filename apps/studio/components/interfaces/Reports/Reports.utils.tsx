import dayjs from 'dayjs'

import useDbQuery, { DbQueryHook } from 'hooks/analytics/useDbQuery'
import useLogsQuery, { LogsQueryHook } from 'hooks/analytics/useLogsQuery'
import type { BaseQueries, PresetConfig, ReportQuery } from './Reports.types'
import {
  isUnixMicro,
  unixMicroToIsoTimestamp,
} from 'components/interfaces/Settings/Logs/Logs.utils'
import { REPORT_STATUS_CODE_COLORS } from 'data/reports/report.utils'
import { getHttpStatusCodeInfo } from 'lib/http-status-codes'

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

/**
 * Extracts distinct status codes from log data rows
 */
export function extractStatusCodesFromData(data: any[]): string[] {
  const statusCodes = new Set<string>()

  data.forEach((item: any) => {
    if (item.status_code !== undefined && item.status_code !== null) {
      statusCodes.add(String(item.status_code))
    }
  })

  return Array.from(statusCodes).sort()
}

/**
 * Generates chart attributes for status codes with labels and colors
 */
export function generateStatusCodeAttributes(statusCodes: string[]) {
  return statusCodes.map((code) => ({
    attribute: code,
    label: `${code} ${getHttpStatusCodeInfo(parseInt(code, 10)).label}`,
    color: REPORT_STATUS_CODE_COLORS[code] || REPORT_STATUS_CODE_COLORS.default,
  }))
}

/**
 * Pivots rows of { timestamp, status_code, count } into { timestamp, [status_code]: count }
 * and normalizes timestamps to ISO strings (UTC), filling missing codes with 0 per timestamp
 */
export function transformStatusCodeData(data: any[], statusCodes: string[]) {
  const pivotedData = data.reduce((acc: Record<string, any>, d: any) => {
    const timestamp = isUnixMicro(d.timestamp)
      ? unixMicroToIsoTimestamp(d.timestamp)
      : dayjs.utc(d.timestamp).toISOString()
    if (!acc[timestamp]) {
      acc[timestamp] = { timestamp }
      statusCodes.forEach((code) => {
        acc[timestamp][code] = 0
      })
    }
    const codeKey = String(d.status_code)
    if (codeKey in acc[timestamp]) {
      acc[timestamp][codeKey] = d.count
    }
    return acc
  }, {})

  return Object.values(pivotedData)
}

/**
 * Extract distinct string values for a given field from data rows
 */
export function extractDistinctValuesFromData(data: any[], field: string): string[] {
  const values = new Set<string>()
  data.forEach((item: any) => {
    if (item[field] !== undefined && item[field] !== null) {
      values.add(String(item[field]))
    }
  })
  return Array.from(values).sort()
}

/**
 * Generates chart attributes from a list of category values
 */
export function generateCategoryAttributes(
  values: string[],
  labelResolver?: (v: string) => string
) {
  return values.map((v) => ({
    attribute: v,
    label: labelResolver ? labelResolver(v) : v,
  }))
}

/**
 * Pivot rows of { timestamp, [categoryField], count } into { timestamp, [category]: count }
 */
export function transformCategoricalCountData(
  data: any[],
  categoryField: string,
  categories: string[]
) {
  const pivotedData = data.reduce((acc: Record<string, any>, d: any) => {
    const timestamp = isUnixMicro(d.timestamp)
      ? unixMicroToIsoTimestamp(d.timestamp)
      : dayjs.utc(d.timestamp).toISOString()
    if (!acc[timestamp]) {
      acc[timestamp] = { timestamp }
      categories.forEach((c) => {
        acc[timestamp][c] = 0
      })
    }
    const key = String(d[categoryField])
    if (key in acc[timestamp]) {
      acc[timestamp][key] = d.count
    }
    return acc
  }, {})

  return Object.values(pivotedData)
}
