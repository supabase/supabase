import dayjs from 'dayjs'

import type { DatetimeHelper } from '../Settings/Logs/Logs.types'
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
    calcFrom: () => dayjs().subtract(14, 'day').startOf('day').toISOString(),
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

export const generateRegexpWhere = (filters: ReportFilterItem[], prepend = true) => {
  if (filters.length === 0) return ''
  const conditions = filters
    .map((filter) => {
      const splitKey = filter.key.split('.')
      const normalizedKey = [splitKey[splitKey.length - 2], splitKey[splitKey.length - 1]].join('.')
      const filterKey = filter.key.includes('.') ? normalizedKey : filter.key

      if (filter.compare === 'matches') {
        return `REGEXP_CONTAINS(${filterKey}, '${filter.value}')`
      } else if (filter.compare === 'is') {
        return `${filterKey} = ${filter.value}`
      }
    })
    .join(' AND ')
  if (prepend) {
    return 'WHERE ' + conditions
  } else {
    return 'AND ' + conditions
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
        limit 10
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
        limit 10
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
        limit 10
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
  [Presets.STORAGE]: {
    title: 'Storage',
    queries: {
      cacheHitRate: {
        queryType: 'logs',
        // storage report does not perform any filtering
        sql: (_filters) => `
-- cache-hit-rate
SELECT
  timestamp_trunc(timestamp, hour) as timestamp,
  countif( h.cf_cache_status in ('HIT', 'STALE', 'REVALIDATED', 'UPDATING') ) as hit_count,
  countif( h.cf_cache_status in ('MISS', 'NONE/UNKNOWN', 'EXPIRED', 'BYPASS', 'DYNAMIC') ) as miss_count
from edge_logs f
  cross join unnest(f.metadata) as m
  cross join unnest(m.request) as r
  cross join unnest(m.response) as res
  cross join unnest(res.headers) as h
where starts_with(r.path, '/storage/v1/object') and r.method = 'GET'
group by timestamp
order by timestamp desc
`,
      },
      topCacheMisses: {
        queryType: 'logs',
        // storage report does not perform any filtering
        sql: (_filters) => `
-- top-cache-misses
SELECT
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
limit 12
    `,
      },
    },
  },
  [Presets.QUERY_PERFORMANCE]: {
    title: 'Query performance',
    queries: {
      mostFrequentlyInvoked: {
        queryType: 'db',
        sql: (_params, where, orderBy) => `
-- Most frequently called queries
set search_path to public, extensions;

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
  ${where || ''}
  ${orderBy || 'order by statements.calls desc'}
  limit 20;`,
      },
      mostTimeConsuming: {
        queryType: 'db',
        sql: (_, where, orderBy) => `
-- Most time consuming queries
set search_path to public, extensions;

select
    auth.rolname,
    statements.query,
    statements.calls,
    statements.total_exec_time + statements.total_plan_time as total_time,
    to_char(((statements.total_exec_time + statements.total_plan_time)/sum(statements.total_exec_time + statements.total_plan_time) OVER()) * 100, 'FM90D0') || '%'  AS prop_total_time
  from pg_stat_statements as statements
    inner join pg_authid as auth on statements.userid = auth.oid
  ${where || ''}
  ${orderBy || 'order by total_time desc'}
  limit 20;`,
      },
      slowestExecutionTime: {
        queryType: 'db',
        sql: (_params, where, orderBy) => `
-- Slowest queries by max execution time
set search_path to public, extensions;

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
  ${where || ''}
  ${orderBy || 'order by max_time desc'}
  limit 20`,
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
  [Presets.DATABASE]: {
    title: 'database',
    queries: {
      largeObjects: {
        queryType: 'db',
        sql: (_) => `SELECT 
        SCHEMA_NAME,
        relname,
        table_size
      FROM
        (SELECT 
          pg_catalog.pg_namespace.nspname AS SCHEMA_NAME,
          relname,
          pg_relation_size(pg_catalog.pg_class.oid) AS table_size
        FROM pg_catalog.pg_class
        JOIN pg_catalog.pg_namespace ON relnamespace = pg_catalog.pg_namespace.oid
        ) t
      WHERE SCHEMA_NAME NOT LIKE 'pg_%'
      ORDER BY table_size DESC
      LIMIT 5;`,
      },
    },
  },
}
