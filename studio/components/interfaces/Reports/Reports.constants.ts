import dayjs from 'dayjs'
import { DatetimeHelper } from '../Settings/Logs'
import { PresetConfig, Presets, ReportFilterItem } from './Reports.types'

export const LAYOUT_COLUMN_COUNT = 24

export const REPORTS_DATEPICKER_HELPERS: DatetimeHelper[] = [
  {
    text: 'Last 24 hours',
    calcFrom: () => dayjs().subtract(1, 'day').startOf('day').toISOString(),
    calcTo: () => '',
    default: true,
  },
  {
    text: 'Last 7 days',
    calcFrom: () => dayjs().subtract(7, 'day').startOf('day').toISOString(),
    calcTo: () => '',
  },
  {
    text: 'Last 14 days',
    calcFrom: () => dayjs().subtract(7, 'day').startOf('day').toISOString(),
    calcTo: () => '',
  },
  {
    text: 'Last 30 days',
    calcFrom: () => dayjs().subtract(30, 'day').startOf('day').toISOString(),
    calcTo: () => '',
  },
]

export const DEFAULT_QUERY_PARAMS = {
  iso_timestamp_start: REPORTS_DATEPICKER_HELPERS[0].calcFrom(),
  iso_timestamp_end: REPORTS_DATEPICKER_HELPERS[0].calcTo(),
}

const generateRegexpWhere = (filters: ReportFilterItem[], prepend = true) => {
  if (filters.length === 0) return ''
  const conditions = filters
    .map((filter) => {
      const splitKey = filter.key.split('.')
      const normalizedKey = [splitKey[splitKey.length - 2], splitKey[splitKey.length - 1]].join('.')
      if (filter.compare === 'matches') {
        return `REGEXP_CONTAINS(${normalizedKey}, '${filter.value}')`
      } else if (filter.compare === 'is') {
        return `${normalizedKey} = ${filter.value}`
      }
    })
    .join(' AND ')
  if (prepend) {
    return 'WHERE ' + conditions
  } else {
    return conditions
  }
}

export const PRESET_CONFIG: Record<Presets, PresetConfig> = {
  [Presets.API]: {
    title: 'API',
    queries: {
      totalRequests: {
        queryType: 'logs',
        sql: (filters) => `
        select
          cast(timestamp_trunc(t.timestamp, hour) as datetime) as timestamp,
          count(t.id) as count
        FROM edge_logs t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
          ${generateRegexpWhere(filters)}
        GROUP BY
          timestamp
        ORDER BY
          timestamp ASC`,
      },
      topRoutes: {
        queryType: 'logs',
        sql: (filters) => `
        select
          request.path as path,
          request.method as method,
          request.search as search,
          response.status_code as status_code,
          count(t.id) as count
        from edge_logs t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
          ${generateRegexpWhere(filters)}
        group by
          request.path, request.method, request.search, response.status_code
        order by
          count desc
        limit
        3
        `,
      },
      errorCounts: {
        queryType: 'logs',
        sql: (filters) => `
        select
          cast(timestamp_trunc(t.timestamp, hour) as datetime) as timestamp,
          count(t.id) as count
        FROM edge_logs t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
        WHERE
          response.status_code >= 400
        ${generateRegexpWhere(filters, false)}
        GROUP BY
          timestamp
        ORDER BY
          timestamp ASC
        `,
      },
      topErrorRoutes: {
        queryType: 'logs',
        sql: (filters) => `
        select
          request.path as path,
          request.method as method,
          request.search as search,
          response.status_code as status_code,
          count(t.id) as count
        from edge_logs t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
        where
          response.status_code >= 400
        ${generateRegexpWhere(filters, false)}
        group by
          request.path, request.method, request.search, response.status_code
        order by
          count desc
        limit
        3
        `,
      },
      responseSpeed: {
        queryType: 'logs',
        sql: (filters) => `
        select
          cast(timestamp_trunc(t.timestamp, hour) as datetime) as timestamp,
          avg(response.origin_time) as avg
        FROM
          edge_logs t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
          ${generateRegexpWhere(filters)}
        GROUP BY
          timestamp
        ORDER BY
          timestamp ASC
      `,
      },
      topSlowRoutes: {
        queryType: 'logs',
        sql: (filters) => `
        select
          request.path as path,
          request.method as method,
          request.search as search,
          response.status_code as status_code,
          count(t.id) as count,
          avg(response.origin_time) as avg
        from edge_logs t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
        ${generateRegexpWhere(filters)}
        group by
          request.path, request.method, request.search, response.status_code
        order by
          avg desc
        limit
        3
        `,
      },
      networkTraffic: {
        queryType: 'logs',
        sql: (filters) => `
        select
          cast(timestamp_trunc(t.timestamp, hour) as datetime) as timestamp,
          coalesce(
            safe_divide(
              sum(
                cast(coalesce(headers.content_length, "0") as int64)
              ),
              1000000
            ),
            0
          ) as ingress_mb,
          coalesce(
            safe_divide(
              sum(
                cast(coalesce(resp_headers.content_length, "0") as int64)
              ),
              1000000
            ),
            0
          ) as egress_mb,
        FROM
          edge_logs t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
          cross join unnest(response.headers) as resp_headers
          ${generateRegexpWhere(filters)}
        GROUP BY
          timestamp
        ORDER BY
          timestamp ASC
        `,
      },
    },
  },
  [Presets.AUTH]: {
    title: '',
    queries: {},
  },
  [Presets.QUERY_PERFORMANCE]: {
    title: 'Query performance',
    queries: {
      mostFrequentlyInvoked: {
        queryType: 'db',
        sql: (_params) => `
-- Most frequently called queries
-- A limit of 100 has been added below
select
    auth.rolname,
    statements.query,
    statements.calls,
    -- -- Postgres 13, 14, 15
    statements.total_exec_time + statements.total_plan_time as total_time,
    statements.min_exec_time + statements.min_plan_time as min_time,
    statements.max_exec_time + statements.max_plan_time as max_time,
    statements.mean_exec_time + statements.mean_plan_time as mean_time,
    -- -- Postgres <= 12
    -- total_time,
    -- min_time,
    -- max_time,
    -- mean_time,
    statements.rows / statements.calls as avg_rows
  from pg_stat_statements as statements
    inner join pg_authid as auth on statements.userid = auth.oid
  order by
    statements.calls desc
  limit 10;`,
      },
      mostTimeConsuming: {
        queryType: 'db',
        sql: (_params) => `-- A limit of 100 has been added below
select
    auth.rolname,
    statements.query,
    statements.calls,
    statements.total_exec_time + statements.total_plan_time as total_time,
    to_char(((statements.total_exec_time + statements.total_plan_time)/sum(statements.total_exec_time + statements.total_plan_time) OVER()) * 100, 'FM90D0') || '%'  AS prop_total_time
  from pg_stat_statements as statements
    inner join pg_authid as auth on statements.userid = auth.oid
  order by
    total_time desc
  limit 10;`,
      },
      slowestExecutionTime: {
        queryType: 'db',
        sql: (_params) => `-- Slowest queries by max execution time
-- A limit of 100 has been added below
select
    auth.rolname,
    statements.query,
    statements.calls,
    -- -- Postgres 13, 14, 15
    statements.total_exec_time + statements.total_plan_time as total_time,
    statements.min_exec_time + statements.min_plan_time as min_time,
    statements.max_exec_time + statements.max_plan_time as max_time,
    statements.mean_exec_time + statements.mean_plan_time as mean_time,
    -- -- Postgres <= 12
    -- total_time,
    -- min_time,
    -- max_time,
    -- mean_time,
    statements.rows / statements.calls as avg_rows
  from pg_stat_statements as statements
    inner join pg_authid as auth on statements.userid = auth.oid
  order by
    max_time desc
  limit 10`,
      },
      queryHitRate: {
        queryType: 'db',
        sql: (_params) => `-- Cache and index hit rate
select
    'index hit rate' as name,
    (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read),0) as ratio
  from pg_statio_user_indexes
  union all
  select
    'table hit rate' as name,
    sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read),0) as ratio
  from pg_statio_user_tables;`,
      },
    },
  },
}

export const DATETIME_FORMAT = 'MMM D, ha'
export const DATETIME_SECOND_FORMAT = 'MMM D, ha'
