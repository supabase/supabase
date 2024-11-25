import dayjs from 'dayjs'

import type { DatetimeHelper, FilterTableSet, LogTemplate } from './Logs.types'

export const LOGS_EXPLORER_DOCS_URL =
  'https://supabase.com/docs/guides/platform/logs#querying-with-the-logs-explorer'

export const LOGS_LARGE_DATE_RANGE_DAYS_THRESHOLD = 4

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
  p.user_name,
  count(*) as count
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
    searchString: `select
  cast(timestamp as datetime) as timestamp,
  h.x_real_ip
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
  cf.country,
  count(*) as count
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
  cast(timestamp as datetime) as timestamp,
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
    searchString: `select
  cast(timestamp as datetime) as timestamp,
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
    searchString: `select
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
    searchString: `select
  cast(timestamp as datetime) as timestamp,
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
    searchString: `select
  cast(t.timestamp as datetime) as timestamp,
  p.error_severity,
  event_message
from postgres_logs as t
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
    description: 'Count of errors by users',
    mode: 'custom',
    searchString: `select
  count(t.timestamp) as count,
  p.user_name,
  p.error_severity
from postgres_logs as t
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
  {
    label: 'Auth Endpoint Events',
    description: 'Endpoint events filtered by path',
    mode: 'custom',
    searchString: `select
  t.timestamp,
  event_message
from auth_logs as t
where
  regexp_contains(event_message,"level.{3}(info|warning||error|fatal)")
  -- and regexp_contains(event_message,"path.{3}(/token|/recover|/signup|/otp)")
limit 100
`,
    for: ['database'],
  },
  {
    label: 'Storage Object Requests',
    description: 'Number of requests done on Storage Objects',
    mode: 'custom',
    searchString: `select
  r.method as http_verb,
  r.path as filepath,
  count(*) as num_requests
from edge_logs
  cross join unnest(metadata) as m
  cross join unnest(m.request) AS r
  cross join unnest(r.headers) AS h
where
  path like '%storage/v1/object/%'
group by
  r.path, r.method
order by
  num_requests desc
limit 100
`,
    for: ['api'],
  },
  {
    label: 'Storage Egress Requests',
    description: 'Check the number of requests done on Storage Affecting Egress',
    mode: 'custom',
    searchString: `select
    r.method as http_verb,
    r.path as filepath,
    count(*) as num_requests,
  from edge_logs
    cross join unnest(metadata) as m
    cross join unnest(m.request) AS r
    cross join unnest(r.headers) AS h
  where
    (path like '%storage/v1/object/%' or path like '%storage/v1/render/%')
    and r.method = 'GET'
  group by
    r.path, r.method
  order by
    num_requests desc
  limit 100
`,
    for: ['api'],
  },
  {
    label: 'Storage Top Cache Misses',
    description: 'The top Storage requests that miss caching',
    mode: 'custom',
    searchString: `select
  r.path as path,
  r.search as search,
  count(id) as count
from edge_logs f
  cross join unnest(f.metadata) as m
  cross join unnest(m.request) as r
  cross join unnest(m.response) as res
  cross join unnest(res.headers) as h
where starts_with(r.path, '/storage/v1/object')
  and r.method = 'GET'
  and h.cf_cache_status in ('MISS', 'NONE/UNKNOWN', 'EXPIRED', 'BYPASS', 'DYNAMIC')
group by path, search
order by count desc
limit 100
`,
    for: ['api'],
  },
]

const _SQL_FILTER_COMMON = {
  search_query: (value: string) => `regexp_contains(event_message, '${value}')`,
}

export const SQL_FILTER_TEMPLATES: any = {
  postgres_logs: {
    ..._SQL_FILTER_COMMON,
    database: (value: string) => `identifier = '${value}'`,
    'severity.error': `parsed.error_severity in ('ERROR', 'FATAL', 'PANIC')`,
    'severity.noError': `parsed.error_severity not in ('ERROR', 'FATAL', 'PANIC')`,
    'severity.log': `parsed.error_severity = 'LOG'`,
  },
  edge_logs: {
    ..._SQL_FILTER_COMMON,
    database: (value: string) => `identifier = '${value}'`,
    'status_code.error': `response.status_code between 500 and 599`,
    'status_code.success': `response.status_code between 200 and 299`,
    'status_code.warning': `response.status_code between 400 and 499`,

    'product.database': `request.path like '/rest/%' or request.path like '/graphql/%'`,
    'product.storage': `request.path like '/storage/%'`,
    'product.auth': `request.path like '/auth/%'`,
    'product.realtime': `request.path like '/realtime/%'`,

    'method.get': `request.method = 'GET'`,
    'method.post': `request.method = 'POST'`,
    'method.put': `request.method = 'PUT'`,
    'method.patch': `request.method = 'PATCH'`,
    'method.delete': `request.method = 'DELETE'`,
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
    'severity.warn': `metadata.level = 'warn'`,
  },
  auth_logs: {
    ..._SQL_FILTER_COMMON,
    'severity.error': `metadata.level = 'error' or metadata.level = 'fatal'`,
    'severity.warning': `metadata.level = 'warning'`,
    'severity.info': `metadata.level = 'info'`,
    'status_code.server_error': `cast(metadata.status as int64) between 500 and 599`,
    'status_code.client_error': `cast(metadata.status as int64) between 400 and 499`,
    'status_code.redirection': `cast(metadata.status as int64) between 300 and 399`,
    'status_code.success': `cast(metadata.status as int64) between 200 and 299`,
    'endpoints.admin': `REGEXP_CONTAINS(metadata.path, "/admin")`,
    'endpoints.signup': `REGEXP_CONTAINS(metadata.path, "/signup|/invite|/verify")`,
    'endpoints.authentication': `REGEXP_CONTAINS(metadata.path, "/token|/authorize|/callback|/otp|/magiclink")`,
    'endpoints.recover': `REGEXP_CONTAINS(metadata.path, "/recover")`,
    'endpoints.user': `REGEXP_CONTAINS(metadata.path, "/user")`,
    'endpoints.logout': `REGEXP_CONTAINS(metadata.path, "/logout")`,
  },
  realtime_logs: {
    ..._SQL_FILTER_COMMON,
  },
  storage_logs: {
    ..._SQL_FILTER_COMMON,
  },
  postgrest_logs: {
    ..._SQL_FILTER_COMMON,
    database: (value: string) => `identifier = '${value}'`,
  },
  pgbouncer_logs: {
    ..._SQL_FILTER_COMMON,
  },
  supavisor_logs: {
    ..._SQL_FILTER_COMMON,
    database: (value: string) => `m.project like '${value}%'`,
  },
}

export enum LogsTableName {
  EDGE = 'edge_logs',
  POSTGRES = 'postgres_logs',
  FUNCTIONS = 'function_logs',
  FN_EDGE = 'function_edge_logs',
  AUTH = 'auth_logs',
  REALTIME = 'realtime_logs',
  STORAGE = 'storage_logs',
  POSTGREST = 'postgrest_logs',
  SUPAVISOR = 'supavisor_logs',
  WAREHOUSE = 'warehouse_logs',
  PG_CRON = 'pg_cron_logs',
}

export const LOGS_TABLES = {
  api: LogsTableName.EDGE,
  database: LogsTableName.POSTGRES,
  functions: LogsTableName.FUNCTIONS,
  fn_edge: LogsTableName.FN_EDGE,
  auth: LogsTableName.AUTH,
  realtime: LogsTableName.REALTIME,
  storage: LogsTableName.STORAGE,
  postgrest: LogsTableName.POSTGREST,
  supavisor: LogsTableName.SUPAVISOR,
  warehouse: LogsTableName.WAREHOUSE,
  pg_cron: LogsTableName.POSTGRES,
}

export const LOGS_SOURCE_DESCRIPTION = {
  [LogsTableName.EDGE]: 'Logs obtained from the network edge, containing all API requests',
  [LogsTableName.POSTGRES]: 'Database logs obtained directly from Postgres',
  [LogsTableName.FUNCTIONS]: 'Function logs generated from runtime execution',
  [LogsTableName.FN_EDGE]: 'Function call logs, containing the request and response',
  [LogsTableName.AUTH]: 'Authentication logs from GoTrue',
  [LogsTableName.REALTIME]: 'Realtime server for Postgres logical replication broadcasting',
  [LogsTableName.STORAGE]: 'Object storage logs',
  [LogsTableName.POSTGREST]: 'RESTful API web server logs',
  [LogsTableName.SUPAVISOR]: 'Cloud-native Postgres connection pooler logs',
  [LogsTableName.WAREHOUSE]: 'Logs obtained from a data warehouse collection',
  [LogsTableName.PG_CRON]: 'Postgres logs from pg_cron cron jobs',
}

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
          key: 'put',
          label: 'PUT',
          description: '',
        },
        {
          key: 'post',
          label: 'POST',
          description: '',
        },
        {
          key: 'patch',
          label: 'PATCH',
          description: '',
        },
        {
          key: 'delete',
          label: 'DELETE',
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
          description: 'Show all events that are "error" severity',
        },
        {
          key: 'warn',
          label: 'Warning',
          description: 'Show all events that are "warn" severity',
        },
        {
          key: 'info',
          label: 'Info',
          description: 'Show all events that are "info" severity',
        },
        {
          key: 'debug',
          label: 'Debug',
          description: 'Show all events that are "debug" severity',
        },
        {
          key: 'log',
          label: 'Log',
          description: 'Show all events that are "log" severity',
        },
      ],
    },
  },

  // auth logs
  auth_logs: {
    severity: {
      label: 'Severity',
      key: 'severity',
      options: [
        {
          key: 'error',
          label: 'Error',
          description: 'Show all events that have error or fatal severity',
        },
        {
          key: 'warning',
          label: 'Warning',
          description: 'Show all events that have warning severity',
        },
        {
          key: 'info',
          label: 'Info',
          description: 'Show all events that have info severity',
        },
      ],
    },
    status_code: {
      label: 'Status Code',
      key: 'status_code',
      options: [
        {
          key: 'server_error',
          label: 'Server Error',
          description: 'Show all requests with 5XX status code',
        },
        {
          key: 'client_error',
          label: 'Client Error',
          description: 'Show all requests with 4XX status code',
        },
        {
          key: 'redirection',
          label: 'Redirection',
          description: 'Show all requests that have 3XX status code',
        },
        {
          key: 'success',
          label: 'Success',
          description: 'Show all requests that have 2XX status code',
        },
      ],
    },
    endpoints: {
      label: 'Endpoints',
      key: 'endpoints',
      options: [
        {
          key: 'admin',
          label: 'Admin',
          description: 'Show all admin requests',
        },
        {
          key: 'signup',
          label: 'Sign up',
          description: 'Show all signup and authorization requests',
        },
        {
          key: 'recover',
          label: 'Password Recovery',
          description: 'Show all password recovery requests',
        },
        {
          key: 'authentication',
          label: 'Authentication',
          description: 'Show all authentication flow requests (login, otp, and Oauth2)',
        },
        {
          key: 'user',
          label: 'User',
          description: 'Show all user data requests',
        },
        {
          key: 'logout',
          label: 'Logout',
          description: 'Show all logout requests',
        },
      ],
    },
  },
}

export const LOGS_TAILWIND_CLASSES = {
  log_selection_x_padding: 'px-8',
  space_y: 'px-6',
}

export const PREVIEWER_DATEPICKER_HELPERS: DatetimeHelper[] = [
  {
    text: 'Last hour',
    calcFrom: () => dayjs().subtract(1, 'hour').startOf('hour').toISOString(),
    calcTo: () => '',
    default: true,
  },
  {
    text: 'Last 3 hours',
    calcFrom: () => dayjs().subtract(3, 'hour').startOf('hour').toISOString(),
    calcTo: () => '',
  },
  {
    text: 'Last 24 hours',
    calcFrom: () => dayjs().subtract(1, 'day').startOf('day').toISOString(),
    calcTo: () => '',
  },
]
export const EXPLORER_DATEPICKER_HELPERS: DatetimeHelper[] = [
  {
    text: 'Last hour',
    calcFrom: () => dayjs().subtract(1, 'hour').startOf('hour').toISOString(),
    calcTo: () => '',
    default: true,
  },
  {
    text: 'Last 24 hours',
    calcFrom: () => dayjs().subtract(1, 'day').startOf('day').toISOString(),
    calcTo: () => '',
  },
  {
    text: 'Last 3 days',
    calcFrom: () => dayjs().subtract(3, 'day').startOf('day').toISOString(),
    calcTo: () => '',
  },
  {
    text: 'Last 7 days',
    calcFrom: () => dayjs().subtract(7, 'day').startOf('day').toISOString(),
    calcTo: () => '',
  },
]

export const getDefaultHelper = (helpers: DatetimeHelper[]) =>
  helpers.find((helper) => helper.default) || helpers[0]

export const TIER_QUERY_LIMITS: {
  [x: string]: { text: string; value: 1 | 7 | 28 | 90; unit: 'day'; promptUpgrade: boolean }
} = {
  FREE: { text: '1 day', value: 1, unit: 'day', promptUpgrade: true },
  PRO: { text: '7 days', value: 7, unit: 'day', promptUpgrade: true },
  PAYG: { text: '7 days', value: 7, unit: 'day', promptUpgrade: true },
  TEAM: { text: '28 days', value: 28, unit: 'day', promptUpgrade: true },
  ENTERPRISE: { text: '90 days', value: 90, unit: 'day', promptUpgrade: false },
}

export const LOG_ROUTES_WITH_REPLICA_SUPPORT = [
  '/project/[ref]/logs/edge-logs',
  '/project/[ref]/logs/pooler-logs',
  '/project/[ref]/logs/postgres-logs',
  '/project/[ref]/logs/postgrest-logs',
]
