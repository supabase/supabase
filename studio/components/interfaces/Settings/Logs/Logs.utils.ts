import { Filters, LogData, LogsEndpointParams, LogsTableName, SQL_FILTER_TEMPLATES } from '.'
import dayjs, { Dayjs } from 'dayjs'
import { get } from 'lodash'
import { StripeSubscription } from 'components/interfaces/Billing'

/**
 * Convert a micro timestamp from number/string to iso timestamp
 */
export const unixMicroToIsoTimestamp = (unix: string | number): string => {
  return dayjs.unix(Number(unix) / 1000 / 1000).toISOString()
}

export const isUnixMicro = (unix: string | number): boolean => {
  const digitLength = String(unix).length === 16
  const isNum = !Number.isNaN(Number(unix))
  return isNum && digitLength
}

export const isDefaultLogPreviewFormat = (log: LogData) =>
  log && log.timestamp && log.event_message && log.id

/**
 * Recursively retrieve all nested object key paths.
 *
 * TODO: move to utils
 *
 * @param obj any object
 * @param parent a string representing the parent key
 * @returns string[] all dot paths for keys.
 */
const getDotKeys = (obj: { [k: string]: unknown }, parent?: string): string[] => {
  const keys = Object.keys(obj).filter((k) => obj[k])
  return keys.flatMap((k) => {
    const currKey = parent ? `${parent}.${k}` : k
    if (typeof obj[k] === 'object') {
      return getDotKeys(obj[k] as any, currKey)
    } else {
      return [currKey]
    }
  })
}

/**
 * Root keys in the filter object are considered to be AND filters.
 * Nested keys under a root key are considered to be OR filters.
 *
 * For example:
 * ```
 * {my_value: 'something', nested: {id: 123, test: 123 }}
 * ```
 * This would be converted into `WHERE (my_value = 'something') and (id = 123 or test = 123)
 *
 * The template of the filter determines the actual filter statement. If no template is provided, a generic equality statement will be used.
 * This only applies for root keys of the filter.
 * For example:
 * ```
 * {'my.nested.value': 123}
 * ```
 * with no template, it will be converted into `WHERE (my.nested.value = 123)
 *
 * @returns a where statement with WHERE clause.
 */
const _genWhereStatement = (table: LogsTableName, filters: Filters) => {
  const keys = Object.keys(filters)
  const filterTemplates = SQL_FILTER_TEMPLATES[table]
  const _resolveTemplateToStatement = (dotKey: string): string | null => {
    const template = filterTemplates[dotKey]
    const value = get(filters, dotKey)
    if (value !== undefined && typeof template === 'function') {
      return template(value)
    } else if (template === undefined) {
      // resolve unknwon filters (possibly from filter overrides)
      // no template, set a default
      if (typeof value === 'string') {
        return `${dotKey} = '${value}'`
      } else {
        return `${dotKey} = ${value}`
      }
    } else if (value === undefined && typeof template === 'function') {
      return null
    } else if (template && value === false) {
      // template present, but value is false
      return null
    } else {
      return template
    }
  }

  const statement = keys
    .map((rootKey) => {
      if (typeof filters[rootKey] === 'object') {
        // join all statements with an OR
        const nestedStatements = getDotKeys(filters[rootKey] as Filters, rootKey)
          .map(_resolveTemplateToStatement)
          .filter(Boolean)

        if (nestedStatements.length > 0) {
          return `(${nestedStatements.join(' or ')})`
        } else {
          return null
        }
      } else {
        const nestedStatement = _resolveTemplateToStatement(rootKey)
        if (nestedStatement === null) return null
        return `(${nestedStatement})`
      }
    })
    .filter(Boolean)
    // join all root statements with AND
    .join(' and ')

  if (statement) {
    return 'where ' + statement
  } else {
    return ''
  }
}

export const genDefaultQuery = (table: LogsTableName, filters: Filters) => {
  const where = _genWhereStatement(table, filters)

  switch (table) {
    case 'edge_logs':
      return `select id, timestamp, event_message, request.method, request.path, response.status_code
  from ${table}
  cross join unnest(metadata) as m
  cross join unnest(m.request) as request
  cross join unnest(m.response) as response
  ${where}
  limit 100
  `

    case 'postgres_logs':
      return `select postgres_logs.timestamp, id, event_message, parsed.error_severity from ${table}
  cross join unnest(metadata) as m
  cross join unnest(m.parsed) as parsed
  ${where}
  limit 100
  `

    case 'function_logs':
      return `select id, ${table}.timestamp, event_message, metadata.event_type, metadata.function_id, metadata.level from ${table}
  cross join unnest(metadata) as metadata
  ${where}
  limit 100
    `

    case 'function_edge_logs':
      return `select id, ${table}.timestamp, event_message, response.status_code, request.method, m.function_id, m.execution_time_ms, m.deployment_id, m.version from ${table}
  cross join unnest(metadata) as m
  cross join unnest(m.response) as response
  cross join unnest(m.request) as request
  ${where}
  limit 100
  `

    default:
      return `select id, ${table}.timestamp, event_message from ${table}
  ${where}
  limit 100
  `
  }
}

/**
 * SQL query to retrieve only one log
 */
export const genSingleLogQuery = (table: LogsTableName, id: string) =>
  `select id, timestamp, event_message, metadata from ${table} where id = '${id}' limit 1`

/**
 * Determine if we should show the user an upgrade prompt while browsing logs
 */
export const maybeShowUpgradePrompt = (
  from: string | null | undefined,
  tierKey?: StripeSubscription['tier']['key']
) => {
  const day = Math.abs(dayjs().diff(dayjs(from), 'day'))

  return (
    (day > 1 && tierKey === 'FREE') ||
    (day > 7 && tierKey === 'PRO') ||
    (day > 28 && tierKey === 'TEAM') ||
    (day > 90 && tierKey === 'ENTERPRISE')
  )
}

export const genCountQuery = (table: LogsTableName, filters: Filters): string => {
  const where = _genWhereStatement(table, filters)
  return `SELECT count(*) as count FROM ${table} ${where}`
}

/** calculates how much the chart start datetime should be offset given the current datetime filter params */
export const calcChartStart = (params: Partial<LogsEndpointParams>): [Dayjs, string] => {
  const ite = params.iso_timestamp_end ? dayjs(params.iso_timestamp_end) : dayjs()
  // todo @TzeYiing needs typing
  const its: any = params.iso_timestamp_start ? dayjs(params.iso_timestamp_start) : dayjs()

  let trunc = 'minute'
  let extendValue = 60 * 6
  const minuteDiff = ite.diff(its, 'minute')
  const hourDiff = ite.diff(its, 'hour')
  if (minuteDiff > 60 * 12) {
    trunc = 'hour'
    extendValue = 24 * 5
  } else if (hourDiff > 24 * 3) {
    trunc = 'day'
    extendValue = 7
  }
  //
  // @ts-ignore
  return [its.add(-extendValue, trunc), trunc]
}

/**
 *
 * generates log event chart query
 */
export const genChartQuery = (
  table: LogsTableName,
  params: LogsEndpointParams,
  filters: Filters
) => {
  const [startOffset, trunc] = calcChartStart(params)
  const where = _genWhereStatement(table, filters)
  return `
SELECT
  timestamp_trunc(t.timestamp, ${trunc}) as timestamp,
  count(t.timestamp) as count
FROM
  ${table} t
  cross join unnest(t.metadata) as metadata
  ${
    where
      ? where + ` and t.timestamp > '${startOffset.toISOString()}'`
      : `where t.timestamp > '${startOffset.toISOString()}'`
  }
GROUP BY
timestamp
ORDER BY
  timestamp ASC
  `
}

type TsPair = [string | '', string | '']
export const ensureNoTimestampConflict = (
  [initialStart, initialEnd]: TsPair,
  [nextStart, nextEnd]: TsPair
): TsPair => {
  if (initialStart && initialEnd && nextEnd && !nextStart) {
    const resolvedDiff = dayjs(nextEnd).diff(dayjs(initialStart))
    let start = dayjs(initialStart)

    if (resolvedDiff <= 0) {
      // start ts is definitely before end ts
      const currDiff = Math.abs(dayjs(initialEnd).diff(start, 'minute'))
      // shift start ts backwards by the current ts difference
      start = dayjs(nextEnd).subtract(currDiff, 'minute')
    }
    return [start.toISOString(), nextEnd]
  } else if (!nextEnd && nextStart) {
    return [nextStart, initialEnd]
  } else {
    return [nextStart, nextEnd]
  }
}
