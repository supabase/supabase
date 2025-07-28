import { useMonaco } from '@monaco-editor/react'
import dayjs, { Dayjs } from 'dayjs'
import { get, isEqual } from 'lodash'
import uniqBy from 'lodash/uniqBy'
import { useEffect } from 'react'

import { IS_PLATFORM } from 'common'
import BackwardIterator from 'components/ui/CodeEditor/Providers/BackwardIterator'
import type { PlanId } from 'data/subscriptions/types'
import logConstants from 'shared-data/logConstants'
import { LogsTableName, SQL_FILTER_TEMPLATES } from './Logs.constants'
import type { Filters, LogData, LogsEndpointParams } from './Logs.types'

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

/**
 * Boolean check to verify that there are 3 columns:
 * - id
 * - timestamp
 * - event_message
 */
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
const genWhereStatement = (table: LogsTableName, filters: Filters) => {
  const keys = Object.keys(filters)
  const filterTemplates = SQL_FILTER_TEMPLATES[table]
  const _resolveTemplateToStatement = (dotKey: string): string | null => {
    const template = filterTemplates[dotKey]
    const value = get(filters, dotKey)
    if (value !== undefined && typeof template === 'function') {
      return template(value)
    } else if (template === undefined) {
      // resolve unknown filters (possibly from filter overrides)
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
      if (
        filters[rootKey] === undefined ||
        (typeof filters[rootKey] === 'string' && (filters[rootKey] as string).length === 0)
      ) {
        return null
      } else if (typeof filters[rootKey] === 'object') {
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

export const genDefaultQuery = (table: LogsTableName, filters: Filters, limit: number = 100) => {
  const where = genWhereStatement(table, filters)
  const joins = genCrossJoinUnnests(table)
  const orderBy = 'order by timestamp desc'

  switch (table) {
    case 'edge_logs':
      if (IS_PLATFORM === false) {
        return `
-- local dev edge_logs query
select id, edge_logs.timestamp, event_message, request.method, request.path, request.search, response.status_code
from edge_logs
${joins}
${where}
${orderBy}
limit ${limit};
`
      }
      return `select id, identifier, timestamp, event_message, request.method, request.path, request.search, response.status_code
  from ${table}
  ${joins}
  ${where}
  ${orderBy}
  limit ${limit}
  `

    case 'postgres_logs':
      if (IS_PLATFORM === false) {
        return `
select postgres_logs.timestamp, id, event_message, parsed.error_severity, parsed.detail, parsed.hint
from postgres_logs
${joins}
${where}
${orderBy}
limit ${limit}
  `
      }
      return `select identifier, postgres_logs.timestamp, id, event_message, parsed.error_severity, parsed.detail, parsed.hint from ${table}
  ${joins}
  ${where}
  ${orderBy}
  limit ${limit}
  `

    case 'function_logs':
      return `select id, ${table}.timestamp, event_message, metadata.event_type, metadata.function_id, metadata.level from ${table}
  ${joins}
  ${where}
  ${orderBy}
  limit ${limit}
    `

    case 'auth_logs':
      return `select id, ${table}.timestamp, event_message, metadata.level, metadata.status, metadata.path, metadata.msg as msg, metadata.error from ${table}
  ${joins}
  ${where}
  ${orderBy}
  limit ${limit}
    `

    case 'function_edge_logs':
      return `select id, ${table}.timestamp, event_message, response.status_code, request.method, m.function_id, m.execution_time_ms, m.deployment_id, m.version from ${table}
  ${joins}
  ${where}
  ${orderBy}
  limit ${limit}
  `
    case 'supavisor_logs':
      return `select id, ${table}.timestamp, event_message from ${table} ${joins} ${where} ${orderBy} limit ${limit}`

    case 'pg_upgrade_logs':
      return `select id, ${table}.timestamp, event_message from ${table} ${joins} ${where} ${orderBy} limit 100`

    default:
      return `select id, ${table}.timestamp, event_message from ${table}
  ${where}
  ${orderBy}
  limit ${limit}
  `

    case 'pg_cron_logs':
      const baseWhere = `where (parsed.application_name = 'pg_cron' OR event_message LIKE '%cron job%')`

      const pgCronWhere = where ? `${baseWhere} AND ${where.substring(6)}` : baseWhere

      return `select identifier, postgres_logs.timestamp, id, event_message, parsed.error_severity, parsed.query
from postgres_logs
  cross join unnest(metadata) as m
  cross join unnest(m.parsed) as parsed
${pgCronWhere}
${orderBy}
limit ${limit}
`
  }
}

/**
 * Hardcoded cross join unnests and aliases for each table.
 * Should be used together with the getWhereStatements to allow for filtering on aliases
 */
const genCrossJoinUnnests = (table: LogsTableName) => {
  switch (table) {
    case 'edge_logs':
      return `cross join unnest(metadata) as m
  cross join unnest(m.request) as request
  cross join unnest(m.response) as response`

    case 'postgres_logs':
      return `cross join unnest(metadata) as m
  cross join unnest(m.parsed) as parsed`

    case 'function_logs':
      return `cross join unnest(metadata) as metadata`

    case 'auth_logs':
      return `cross join unnest(metadata) as metadata`

    case 'function_edge_logs':
      return `cross join unnest(metadata) as m
  cross join unnest(m.response) as response
  cross join unnest(m.request) as request`

    case 'supavisor_logs':
      return `cross join unnest(metadata) as m`

    default:
      return ''
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
export const maybeShowUpgradePrompt = (from: string | null | undefined, planId?: PlanId) => {
  const day = Math.abs(dayjs().diff(dayjs(from), 'day'))

  return (
    (day > 1 && planId === 'free') ||
    (day > 7 && planId === 'pro') ||
    (day > 28 && planId === 'team') ||
    (day > 90 && planId === 'enterprise')
  )
}

export const genCountQuery = (table: LogsTableName, filters: Filters): string => {
  const where = genWhereStatement(table, filters)
  const joins = genCrossJoinUnnests(table)
  return `SELECT count(*) as count FROM ${table} ${joins} ${where}`
}

/** calculates how much the chart start datetime should be offset given the current datetime filter params */
const calcChartStart = (params: Partial<LogsEndpointParams>): [Dayjs, string] => {
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
  let where = genWhereStatement(table, filters)
  const errorCondition = getErrorCondition(table)
  const warningCondition = getWarningCondition(table)

  // pg_cron logs are a subset of postgres logs
  // to calculate the chart, we need to query postgres logs
  if (table === LogsTableName.PG_CRON) {
    table = LogsTableName.POSTGRES
    where = `where (parsed.application_name = 'pg_cron' OR event_message LIKE '%cron job%')`
  }

  let joins = genCrossJoinUnnests(table)

  const q = `
SELECT
-- log-event-chart
  timestamp_trunc(t.timestamp, ${trunc}) as timestamp,
  count(CASE WHEN NOT (${errorCondition} OR ${warningCondition}) THEN 1 END) as ok_count,
  count(CASE WHEN ${errorCondition} THEN 1 END) as error_count,
  count(CASE WHEN ${warningCondition} THEN 1 END) as warning_count,
FROM
  ${table} t
  ${joins}
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
  return q
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

/**
 * Adds SQL code hints to logs explorer code editor
 */
export const useEditorHints = () => {
  const monaco = useMonaco()

  useEffect(() => {
    if (monaco) {
      const competionProvider = {
        triggerCharacters: ['`', ' ', '.'],
        provideCompletionItems: function (model: any, position: any, context: any) {
          let iterator = new BackwardIterator(model, position.column - 2, position.lineNumber - 1)
          if (iterator.isNextDQuote()) return { suggestions: [] }
          let suggestions: { label: string; kind: any; insertText: string }[] = []

          let schemasInUse = logConstants.schemas.filter((schema) =>
            iterator._text.includes(schema.reference)
          )
          if (schemasInUse.length === 0) {
            schemasInUse = logConstants.schemas
          }

          if (iterator.isNextPeriod()) {
            // should be nested key reference, suggest all tail endings of available fields
            const fields = schemasInUse.flatMap((schema) => schema.fields)
            const trailingKeys = fields.flatMap((field) => {
              const [_head, ...rest] = field.path.split('.')
              return rest
            })

            const trailingToAdd = trailingKeys.map((key) => ({
              label: key,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: key,
            }))
            suggestions = suggestions.concat(trailingToAdd)
          }

          if (context.triggerCharacter === '`' || context.triggerCharacter === ' ') {
            // should be reference or start of key
            const referencesToAdd = logConstants.schemas.map((schema) => ({
              label: schema.reference,
              kind: monaco.languages.CompletionItemKind.Class,
              insertText: schema.reference,
            }))

            const fields = schemasInUse.flatMap((schema) => schema.fields)
            const leadingKeys = fields.flatMap((field) => {
              const splitPath = field.path.split('.')

              return splitPath.slice(0, -1)
            })

            const leadingToAdd = leadingKeys.map((key) => ({
              label: key,
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: key,
            }))
            suggestions = suggestions.concat(leadingToAdd)
            suggestions = suggestions.concat(referencesToAdd)
          }
          return {
            suggestions: uniqBy(suggestions, 'label'),
          }
        },
      } as any

      // register completion item provider for pgsql
      const completeProvider = monaco.languages.registerCompletionItemProvider(
        'pgsql',
        competionProvider
      )

      return () => {
        completeProvider.dispose()
      }
    }
  }, [monaco])
}

/**
 * Assumes that all timestamps are in ISO-8601 UTC timezone.
 *
 * min/max are the datetime strings that extend beyond the given timeseries data.
 */
export const fillTimeseries = (
  timeseriesData: any[],
  timestampKey: string,
  valueKey: string | string[],
  defaultValue: number,
  min?: string,
  max?: string,
  minPointsToFill: number = 20,
  interval?: string
) => {
  if (timeseriesData.length === 0 && !(min && max)) {
    return []
  }
  // If we have more points than minPointsToFill, just normalize timestamps and return
  if (timeseriesData.length > minPointsToFill) {
    return timeseriesData.map((datum) => {
      const iso = dayjs.utc(datum[timestampKey]).toISOString()
      datum[timestampKey] = iso
      return datum
    })
  }

  if (timeseriesData.length <= 1 && !(min || max)) return timeseriesData
  const dates: unknown[] = timeseriesData.map((datum) => dayjs.utc(datum[timestampKey]))

  const maxDate = max ? dayjs.utc(max) : dayjs.utc(Math.max.apply(null, dates as number[]))
  const minDate = min ? dayjs.utc(min) : dayjs.utc(Math.min.apply(null, dates as number[]))

  // const truncationSample = timeseriesData.length > 0 ? timeseriesData[0][timestampKey] : min || max
  const truncationSamples = timeseriesData.length > 0 ? dates : [minDate, maxDate]
  let truncation: 'second' | 'minute' | 'hour' | 'day'
  let step = 1

  if (interval) {
    const match = interval.match(/^(\d+)(m|h|d|s)$/)
    if (match) {
      step = parseInt(match[1], 10)
      const unitChar = match[2] as 'm' | 'h' | 'd' | 's'
      const unitMap = { s: 'second', m: 'minute', h: 'hour', d: 'day' } as const
      truncation = unitMap[unitChar]
    } else {
      // Fallback for invalid format
      truncation = getTimestampTruncation(truncationSamples as Dayjs[])
    }
  } else {
    truncation = getTimestampTruncation(truncationSamples as Dayjs[])
  }

  const newData = timeseriesData.map((datum) => {
    const timestamp = datum[timestampKey]
    const iso = isUnixMicro(timestamp)
      ? unixMicroToIsoTimestamp(timestamp)
      : dayjs.utc(timestamp).toISOString()
    datum[timestampKey] = iso
    return datum
  })

  let currentDate = minDate
  while (currentDate.isBefore(maxDate) || currentDate.isSame(maxDate)) {
    const found = dates.find((d) => {
      const d_date = d as Dayjs
      return (
        d_date.year() === currentDate.year() &&
        d_date.month() === currentDate.month() &&
        d_date.date() === currentDate.date() &&
        d_date.hour() === currentDate.hour() &&
        d_date.minute() === currentDate.minute()
      )
    })
    if (!found) {
      const keys = typeof valueKey === 'string' ? [valueKey] : valueKey

      const toMerge = keys.reduce(
        (acc, key) => ({
          ...acc,
          [key]: defaultValue,
        }),
        {}
      )
      newData.push({
        [timestampKey]: currentDate.toISOString(),
        ...toMerge,
      })
    }
    currentDate = currentDate.add(step, truncation)
  }

  return newData
}

const getTimestampTruncation = (samples: Dayjs[]): 'second' | 'minute' | 'hour' | 'day' => {
  const truncationCounts = samples.reduce(
    (acc, sample) => {
      const truncation = _getTruncation(sample)
      acc[truncation] += 1

      return acc
    },
    {
      second: 0,
      minute: 0,
      hour: 0,
      day: 0,
    }
  )

  const mostLikelyTruncation = (
    Object.keys(truncationCounts) as (keyof typeof truncationCounts)[]
  ).reduce((a, b) => (truncationCounts[a] > truncationCounts[b] ? a : b))
  return mostLikelyTruncation
}

const _getTruncation = (date: Dayjs) => {
  const values = ['second', 'minute', 'hour'].map((key) => date.get(key as dayjs.UnitType))
  const zeroCount = values.reduce((acc, value) => {
    if (value === 0) {
      acc += 1
    }
    return acc
  }, 0)
  const truncation = {
    0: 'second' as const,
    1: 'minute' as const,
    2: 'hour' as const,
    3: 'day' as const,
  }[zeroCount]!
  return truncation
}

export function checkForWithClause(query: string) {
  const queryWithoutComments = query.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '')

  const withClauseRegex = /\b(WITH)\b(?=(?:[^']*'[^']*')*[^']*$)/i
  return withClauseRegex.test(queryWithoutComments)
}

export function checkForILIKEClause(query: string) {
  const queryWithoutComments = query.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '')

  const ilikeClauseRegex = /\b(ILIKE)\b(?=(?:[^']*'[^']*')*[^']*$)/i
  return ilikeClauseRegex.test(queryWithoutComments)
}

export function checkForWildcard(query: string) {
  const queryWithoutComments = query.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//gm, '')

  const queryWithoutCount = queryWithoutComments.replace(/count\(\*\)/gi, '')

  const wildcardRegex = /\*/
  return wildcardRegex.test(queryWithoutCount)
}

function getErrorCondition(table: LogsTableName): string {
  switch (table) {
    case 'edge_logs':
      return 'response.status_code >= 500'
    case 'postgres_logs':
      return "parsed.error_severity IN ('ERROR', 'FATAL', 'PANIC')"
    case 'auth_logs':
      return "metadata.level = 'error' OR metadata.status >= 400"
    case 'function_edge_logs':
      return 'response.status_code >= 500'
    case 'function_logs':
      return "metadata.level IN ('error', 'fatal')"
    case 'pg_cron_logs':
      return "parsed.error_severity IN ('ERROR', 'FATAL', 'PANIC')"
    default:
      return 'false'
  }
}

function getWarningCondition(table: LogsTableName): string {
  switch (table) {
    case 'edge_logs':
      return 'response.status_code >= 400 AND response.status_code < 500'
    case 'postgres_logs':
      return "parsed.error_severity IN ('WARNING')"
    case 'auth_logs':
      return "metadata.level = 'warning'"
    case 'function_edge_logs':
      return 'response.status_code >= 400 AND response.status_code < 500'
    case 'function_logs':
      return "metadata.level IN ('warning')"
    default:
      return 'false'
  }
}

export function jwtAPIKey(metadata: any) {
  const apikeyHeader = metadata?.[0]?.request?.[0]?.sb?.[0]?.jwt?.[0]?.apikey?.[0]
  if (!apikeyHeader) {
    return undefined
  }

  if (apikeyHeader.invalid) {
    return '<invalid>'
  }

  const payload = apikeyHeader?.payload?.[0]
  if (!payload) {
    return '<unrecognized>'
  }

  if (
    payload.algorithm === 'HS256' &&
    payload.issuer === 'supabase' &&
    ['anon', 'service_role'].includes(payload.role) &&
    !payload.subject
  ) {
    return payload.role
  }

  return '<unrecognized>'
}

export function apiKey(metadata: any) {
  const apikeyHeader = metadata?.[0]?.request?.[0]?.sb?.[0]?.apikey?.[0]?.apikey?.[0]
  if (!apikeyHeader) {
    return undefined
  }

  if (apikeyHeader.error) {
    return `${apikeyHeader.prefix}... <invalid: ${apikeyHeader.error}>`
  }

  return `${apikeyHeader.prefix}...`
}

export function role(metadata: any) {
  const authorizationHeader = metadata?.[0]?.request?.[0]?.sb?.[0]?.jwt?.[0]?.authorization?.[0]
  if (!authorizationHeader) {
    return undefined
  }

  if (authorizationHeader.invalid) {
    return undefined
  }

  const payload = authorizationHeader?.payload?.[0]
  if (!payload || !payload.role) {
    return undefined
  }

  return payload.role
}
