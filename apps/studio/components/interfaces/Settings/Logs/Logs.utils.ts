import { useMonaco } from '@monaco-editor/react'
import dayjs, { Dayjs } from 'dayjs'
import { get, isEqual } from 'lodash'
import uniqBy from 'lodash/uniqBy'
import { useEffect } from 'react'

import BackwardIterator from 'components/ui/CodeEditor/Providers/BackwardIterator'
import type { PlanId } from 'data/subscriptions/types'
import logConstants from 'shared-data/logConstants'
import { LogsTableName, SQL_FILTER_TEMPLATES } from './Logs.constants'
import type { Filters, LogData, LogsEndpointParams } from './Logs.types'
import { IS_PLATFORM } from 'common'

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

export const genDefaultQuery = (table: LogsTableName, filters: Filters) => {
  const where = genWhereStatement(table, filters)
  const joins = genCrossJoinUnnests(table)
  const orderBy = 'order by timestamp desc'

  switch (table) {
    case 'edge_logs':
      if (IS_PLATFORM === false) {
        return `
-- local dev edge_logs query
select id, edge_logs.timestamp, event_message, request.method, request.path, response.status_code 
from edge_logs 
${joins}
${where}
${orderBy}
limit 100;
`
      }
      return `select id, identifier, timestamp, event_message, request.method, request.path, response.status_code
  from ${table}
  ${joins}
  ${where}
  ${orderBy}
  limit 100
  `

    case 'postgres_logs':
      if (IS_PLATFORM === false) {
        return `
select postgres_logs.timestamp, id, event_message, parsed.error_severity
from postgres_logs
${joins}
${where}
${orderBy}
limit 100
  `
      }
      return `select identifier, postgres_logs.timestamp, id, event_message, parsed.error_severity from ${table}
  ${joins}
  ${where}
  ${orderBy}
  limit 100
  `

    case 'function_logs':
      return `select id, ${table}.timestamp, event_message, metadata.event_type, metadata.function_id, metadata.level from ${table}
  ${joins}
  ${where}
  ${orderBy}
  limit 100
    `

    case 'auth_logs':
      return `select id, ${table}.timestamp, event_message, metadata.level, metadata.status, metadata.path, metadata.msg as msg, metadata.error from ${table}
  ${joins}
  ${where}
  ${orderBy}
  limit 100
    `

    case 'function_edge_logs':
      return `select id, ${table}.timestamp, event_message, response.status_code, request.method, m.function_id, m.execution_time_ms, m.deployment_id, m.version from ${table}
  ${joins}
  ${where}
  ${orderBy}
  limit 100
  `
    case 'supavisor_logs':
      return `select id, ${table}.timestamp, event_message from ${table} ${joins} ${where} ${orderBy} limit 100`

    default:
      return `select id, ${table}.timestamp, event_message from ${table}
  ${where}
  ${orderBy}
  limit 100
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
  const where = genWhereStatement(table, filters)

  let joins = genCrossJoinUnnests(table)

  return `
SELECT
-- log-event-chart
  timestamp_trunc(t.timestamp, ${trunc}) as timestamp,
  count(t.timestamp) as count
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
  max?: string
) => {
  if (timeseriesData.length <= 1 && !(min || max)) return timeseriesData
  const dates: unknown[] = timeseriesData.map((datum) => dayjs.utc(datum[timestampKey]))

  const maxDate = max ? dayjs.utc(max) : dayjs.utc(Math.max.apply(null, dates as number[]))
  const minDate = min ? dayjs.utc(min) : dayjs.utc(Math.min.apply(null, dates as number[]))

  // const truncationSample = timeseriesData.length > 0 ? timeseriesData[0][timestampKey] : min || max
  const truncationSamples = timeseriesData.length > 0 ? dates : [minDate, maxDate]
  const truncation = getTimestampTruncation(truncationSamples as Dayjs[])

  const newData = timeseriesData.map((datum) => {
    const iso = dayjs.utc(datum[timestampKey]).toISOString()
    datum[timestampKey] = iso
    return datum
  })

  const diff = maxDate.diff(minDate, truncation as dayjs.UnitType)
  // Intentional throwing of error here to be caught by Sentry, as this would indicate a bug since charts shouldn't be rendering more than 10k data points
  if (diff > 10000) {
    throw new Error(
      'The selected date range will render more than 10,000 data points within the charts, which will degrade browser performance. Please select a smaller date range.'
    )
  }

  for (let i = 0; i <= diff; i++) {
    const dateToMaybeAdd = minDate.add(i, truncation as dayjs.ManipulateType)

    const keys = typeof valueKey === 'string' ? [valueKey] : valueKey

    const toMerge = keys.reduce(
      (acc, key) => ({
        ...acc,
        [key]: defaultValue,
      }),
      {}
    )

    if (!dates.find((d) => isEqual(d, dateToMaybeAdd))) {
      newData.push({
        [timestampKey]: dateToMaybeAdd.toISOString(),
        ...toMerge,
      })
    }
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
