import { get } from 'lodash'
import { Filters, FilterTableSet, LogTemplate } from '.'

export const TEMPLATES: LogTemplate[] = [
  {
    label: 'Recent Errors',
    mode: 'simple',
    searchString: '[Ee]rror|\\s[45][0-9][0-9]\\s',
    for: ['api'],
  },
  {
    label: 'Commits',
    mode: 'simple',
    searchString: 'COMMIT',
    for: ['database'],
  },
  {
    label: 'Commits By User',
    description: 'Count of commits made by users on the database',
    mode: 'custom',
    searchString: `select
    p.user_name, count(*) as count
from postgres_logs
  left join unnest(metadata) as m on true
  left join unnest(m.parsed) as p on true
where
  regexp_contains(event_message, 'COMMIT')
group by
  p.user_name
    `,
    for: ['database'],
  },
  {
    label: 'Metadata IP',
    description: 'List all IP addresses that used the Supabase API',
    mode: 'custom',
    searchString: `select timestamp, h.x_real_ip
from edge_logs
  left join unnest(metadata) as m on true
  left join unnest(m.request) as r on true
  left join unnest(r.headers) as h on true
where h.x_real_ip is not null
`,
    for: ['api'],
  },
  {
    label: 'Requests by Country',
    description: 'List all ISO 3166-1 alpha-2 country codes that used the Supabase API',
    mode: 'custom',
    searchString: `select 
  cf.country, count(*) as count
from edge_logs
  left join unnest(metadata) as m on true
  left join unnest(m.request) as r on true
  left join unnest(r.cf) as cf on true
group by
  cf.country
order by
  count desc
`,
    for: ['api'],
  },
  {
    label: 'Slow Response Time',
    mode: 'custom',
    description: 'List all Supabase API requests that are slow',
    searchString: `select
  timestamp, 
  event_message,
  r.origin_time
from edge_logs
  cross join unnest(metadata) as m 
  cross join unnest(m.response) as r
where
  r.origin_time > 1000
order by
  timestamp desc
limit 100
`,
    for: ['api'],
  },
  {
    label: '500 Request Codes',
    description: 'List all Supabase API requests that responded witha 5XX status code',
    mode: 'custom',
    searchString: `SELECT
  timestamp, 
  event_message,
  r.status_code
from edge_logs
  cross join unnest(metadata) as m 
  cross join unnest(m.response) as r
where
  r.status_code >= 500
order by
  timestamp desc
limit 100
`,
    for: ['api'],
  },
  {
    label: 'Top Paths',
    description: 'List the most requested Supabase API paths',
    mode: 'custom',
    searchString: `SELECT
  r.path as path,
  r.search as params,
  count(timestamp) as c
from edge_logs
  cross join unnest(metadata) as m 
  cross join unnest(m.request) as r
group by 
  path,
  params 
order by
  c desc
limit 100
`,
    for: ['api'],
  },
  {
    label: 'REST Requests',
    description: 'List all PostgREST requests',
    mode: 'custom',
    searchString: `SELECT
  timestamp,
  event_message
from edge_logs
  cross join unnest(metadata) as m 
  cross join unnest(m.request) as r
where
  path like '%rest/v1%'
order by
  timestamp desc
limit 100
`,
    for: ['api'],
  },
  {
    label: 'Errors',
    description: 'List all Postgres error messages with ERROR, FATAL, or PANIC severity',
    mode: 'custom',
    searchString: `SELECT
  t.timestamp,
  p.error_severity,
  event_message
from
  postgres_logs as t
    cross join unnest(metadata) as m
    cross join unnest(m.parsed) as p
where
  p.error_severity in ('ERROR', 'FATAL', 'PANIC')
order by
  timestamp desc
limit 100
`,
    for: ['database'],
  },
  {
    label: 'Error Count by User',
    mode: 'custom',
    searchString: `select
  count(t.timestamp) as count,
  p.user_name,
  p.error_severity
from
  postgres_logs as t
    cross join unnest(metadata) as m
    cross join unnest(m.parsed) as p
where
  p.error_severity in ('ERROR', 'FATAL', 'PANIC')
group by
  p.user_name,
  p.error_severity
order by
  count desc
limit 100
`,
    for: ['database'],
  },
]

export const LOG_TYPE_LABEL_MAPPING: { [k: string]: string } = {
  explorer: 'Explorer',
  api: 'API',
  database: 'Database',
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
  const keys = Object.keys(obj).filter(k => obj[k])
  return keys.flatMap(k => {
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
 * @returns a whewhere statement with WHERE clause.
 */
const _genWhereStatement = (table: LogsTableName, filters: Filters) => {
  const keys = Object.keys(filters)
  const filterTemplates = SQL_FILTER_TEMPLATES[table]
  const _resolveTemplateToStatement = (dotKey: string) => {
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
    } else {
      return template
    }
  }

  const statement = keys.map(rootKey => {
    if (typeof filters[rootKey] === 'object') {
      // join all statements with an OR
      const nestedStatement = getDotKeys(filters[rootKey] as Filters, rootKey).map(_resolveTemplateToStatement).join(" or ")
      return `(${nestedStatement})`
    } else {
      const nestedStatement = _resolveTemplateToStatement(rootKey)
      return `(${nestedStatement})`
    }

  }).filter(Boolean)
    // join all root statements with AND
    .join(" and ")

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
      return ""
      break
  }
}

const _SQL_FILTER_COMMON = {
  'search_query': (value: string) => `regexp_contains(event_message, '${value}')`
}

export const SQL_FILTER_TEMPLATES: any = {
  postgres_logs: {
    ..._SQL_FILTER_COMMON,
    'severity.error': `metadataParsed.error_severity in ('ERROR', 'FATAL', 'PANIC')`,
    'severity.noError': `metadataParsed.error_severity not in ('ERROR', 'FATAL', 'PANIC')`,
    'severity.log': `metadataParsed.error_severity = 'LOG'`,
  },
  edge_logs: {
    ..._SQL_FILTER_COMMON,
    'status_code.error': `response.status_code between 500 and 599`,
    'status_code.success': `response.status_code between 200 and 299`,
    'status_code.warning': `response.status_code between 400 and 499`,

    'product.database': `request.path like '/rest/%' or request.path like '/graphql/%'`,
    'product.storage': `request.path like '/storage/%'`,
    'product.auth': `request.path like '/auth/%'`,
    'product.realtime': `request.path like '/realtime/%'`,

    'method.get': `request.method = 'GET'`,
    'method.post': `request.method = 'POST'`,
    'method.del': `request.method = 'DEL'`,
    'method.options': `request.method = 'OPTIONS'`,
  },
  function_edge_logs: {
    ..._SQL_FILTER_COMMON,
    'status_code.error': `response.status_code between 500 and 599`,
    'status_code.success': `response.status_code between 200 and 299`,
    'status_code.warning': `response.status_code between 400 and 499`,
  },
  function_logs: {
    ..._SQL_FILTER_COMMON,
    'severity.error': `metadata.level = 'error'`,
    'severity.notError': `metadata.level != 'error'`,
    'severity.log': `metadata.level = 'log'`,
    'severity.info': `metadata.level = 'info'`,
    'severity.debug': `metadata.level = 'debug'`,
  },
}

// export const cleanQuery = (str: string) => str.replaceAll(/\n/g, ' ')
export const cleanQuery = (str: string) => str.replace(/\n/g, ' ')
// .replace(/\n.*\-\-.*(\n)?$?/, "")

export enum LogsTableName {
  EDGE = 'edge_logs',
  POSTGRES = 'postgres_logs',
  FUNCTIONS = 'function_logs',
  FN_EDGE = 'function_edge_logs',
}

export const LOGS_TABLES = {
  api: LogsTableName.EDGE,
  database: LogsTableName.POSTGRES,
  functions: LogsTableName.FUNCTIONS,
  fn_edge: LogsTableName.FN_EDGE,
}

export const LOGS_SOURCE_DESCRIPTION = {
  [LogsTableName.EDGE]: 'Logs obtained from the network edge, containing all API requests.',
  [LogsTableName.POSTGRES]: 'Database logs obtained directly from Postgres.',
  [LogsTableName.FUNCTIONS]: 'Function logs generated from runtime execution.',
  [LogsTableName.FN_EDGE]: 'Function call logs, containing the request and response.',
}

export const genCountQuery = (table: string): string => `SELECT count(*) as count FROM ${table}`

export const genQueryParams = (params: { [k: string]: string }) => {
  // remove keys which are empty strings, null, or undefined
  for (const k in params) {
    const v = params[k]
    if (v === null || v === '' || v === undefined) {
      delete params[k]
    }
  }
  const qs = new URLSearchParams(params).toString()
  return qs
}
export const FILTER_OPTIONS: FilterTableSet = {
  // Postgres logs
  postgres_logs: {
    severity: {
      label: 'Severity',
      key: 'severity',
      options: [
        {
          key: 'error',
          label: 'Error',
          description: 'Show all events with ERROR, PANIC, or FATAL',
        },
        {
          key: 'noError',
          label: 'No Error',
          description: 'Show all non-error events',
        },
        {
          key: 'log',
          label: 'Log',
          description: 'Show all events that are log severity',
        },
      ],
    },
  },

  // Edge logs
  edge_logs: {
    status_code: {
      label: 'Status',
      key: 'status_code',
      options: [
        {
          key: 'error',
          label: 'Error',
          description: '500 error codes',
        },
        {
          key: 'success',
          label: 'Success',
          description: '200 codes',
        },
        {
          key: 'warning',
          label: 'Warning',
          description: '400 codes',
        },
      ],
    },
    product: {
      label: 'Product',
      key: 'product',
      options: [
        {
          key: 'database',
          label: 'Database',
          description: '',
        },
        {
          key: 'auth',
          label: 'Auth',
          description: '',
        },
        {
          key: 'storage',
          label: 'Storage',
          description: '',
        },
        {
          key: 'realtime',
          label: 'Realtime',
          description: '',
        },
      ],
    },
    method: {
      label: 'Method',
      key: 'method',
      options: [
        {
          key: 'get',
          label: 'GET',
          description: '',
        },
        {
          key: 'options',
          label: 'OPTIONS',
          description: '',
        },
        {
          key: 'post',
          label: 'POST',
          description: '',
        },
      ],
    },
  },
  // function_edge_logs
  function_edge_logs: {
    status_code: {
      label: 'Status',
      key: 'status_code',
      options: [
        {
          key: 'error',
          label: 'Error',
          description: '500 error codes',
        },
        {
          key: 'success',
          label: 'Success',
          description: '200 codes',
        },
        {
          key: 'warning',
          label: 'Warning',
          description: '400 codes',
        },
      ],
    },
  },
  // function_logs
  function_logs: {
    severity: {
      label: 'Severity',
      key: 'severity',
      options: [
        {
          key: 'error',
          label: 'Error',
          description: 'Show all events that have error severity',
        },
        {
          key: 'info',
          label: 'Info',
          description: 'Show all events that have error severity',
        },
        {
          key: 'debug',
          label: 'Debug',
          description: 'Show all events that have error severity',
        },
        {
          key: 'log',
          label: 'Log',
          description: 'Show all events that are log severity',
        },
      ],
    },
  },
}

export const LOGS_TAILWIND_CLASSES = {
  log_selection_x_padding: 'px-8',
  space_y: 'px-6',
}
