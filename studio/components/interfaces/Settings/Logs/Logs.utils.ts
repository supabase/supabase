import { Filters, LogsTableName, SQL_FILTER_TEMPLATES } from '.'
import dayjs from 'dayjs'
import { get } from 'lodash'

/**
 * Convert a micro timestamp from number/string to iso timestamp
 */
export const unixMicroToIsoTimestamp = (unix: string | number): string => {
  return dayjs.unix(Number(unix) / 1000).toISOString()
}

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
      return `select id, timestamp, event_message, metadata, request, response, request.method, request.path, response.status_code
  from ${table}
  cross join unnest(metadata) as m
  cross join unnest(m.request) as request
  cross join unnest(m.response) as response
  ${where}
  limit 100
  `
      break

    case 'postgres_logs':
      return `select postgres_logs.timestamp, id, event_message, metadata, metadataparsed.error_severity from ${table} 
  cross join unnest(metadata) as m 
  cross join unnest(m.parsed) as metadataparsed 
  ${where} 
  limit 100
  `
      break

    case 'function_logs':
      return `select id, ${table}.timestamp, event_message, metadata.event_type, metadata.function_id, metadata.level, metadata from ${table}
  cross join unnest(metadata) as metadata
  ${where}
  limit 100
    `
      break

    case 'function_edge_logs':
      return `select id, ${table}.timestamp, event_message, response.status_code, response, request, request.method, m.function_id, m.execution_time_ms, m.deployment_id, m.version from ${table} 
  cross join unnest(metadata) as m
  cross join unnest(m.response) as response
  cross join unnest(m.request) as request
  ${where}
  limit 100
  `

    default:
      return ''
      break
  }
}
