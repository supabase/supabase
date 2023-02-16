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

const generateRexepWhere = (filters: ReportFilterItem[], prepend = true) => {
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
          ${generateRexepWhere(filters)}
        GROUP BY
          timestamp
        ORDER BY
          timestamp ASC`,
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
        ${generateRexepWhere(filters, false)}
        GROUP BY
          timestamp
        ORDER BY
          timestamp ASC
        `,
      },
      responseSpeed: {
        queryType: 'logs',
        sql: (filters) => `
        select
          cast(timestamp_trunc(t.timestamp, hour) as datetime) as timestamp,
          avg(response.origin_time) as avg,
          APPROX_QUANTILES(response.origin_time, 100) as quantiles
        FROM
          edge_logs t
          cross join unnest(metadata) as m
          cross join unnest(m.response) as response
          cross join unnest(m.request) as request
          cross join unnest(request.headers) as headers
          ${generateRexepWhere(filters)}
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
// userAgents: {
//   queryType: 'logs',
//   sql: `
//   select
//     h.user_agent as user_agent,
//     cf.asOrganization as request_source,
//     count(f.id) as count
//   from
//     edge_logs as f
//     cross join unnest(f.metadata) as m
//     cross join unnest(m.request) as r
//     cross join unnest(r.cf) as cf
//     cross join unnest(r.headers) as h
//   group by
//     user_agent,
//     request_source
//   order by
//     count desc
//   limit 12
//   `,
// },
// botScores: {
//   queryType: 'logs',
//   sql: `
//   select
//     h.cf_connecting_ip as ip,
//     h.cf_ipcountry as country,
//     h.user_agent as user_agent,
//     r.path as path,
//     b.score as bot_score,
//     b.verifiedBot as bot_verified,
//     count(f.id) as count
//   from
//     edge_logs as f
//     cross join unnest(f.metadata) as m
//     cross join unnest(m.request) as r
//     cross join unnest(r.cf) as cf
//     cross join unnest(r.headers) as h
//     cross join unnest(cf.botManagement) as b
//   group by
//     ip,
//     country,
//     path,
//     user_agent,
//     bot_score,
//     bot_verified
//   order by
//     bot_score desc
//   limit 20
//         `,
// },
//   },
//   [Presets.AUTH]: {
//     title: 'Auth',
//     queries: {
//       bannedUsers: {
//         queryType: 'db',
//         sql: (_params) => `
// select
//   count(distinct u.id) as count
// from auth.users u
// where u.banned_until is not null and u.banned_until > now()
// limit 1
//         `,
//       },
//       unverifiedUsers: {
//         queryType: 'db',
//         sql: (params) => `
// select
//   date_trunc('day', u.created_at) as timestamp,
//   count(distinct u.id) as count
// from auth.users u
// where u.confirmed_at is null and '${params.iso_timestamp_start}' < u.created_at
// group by timestamp
// order by timestamp desc
//         `,
//       },
//       signUpProviders: {
//         queryType: 'db',
//         sql: (params) => `
// select
//   sum(count(u.id)) over (order by date_trunc('day', u.created_at)) as count,
//   date_trunc('day', u.created_at) as timestamp,
//   i.provider as provider
// from auth.users u
// join auth.identities as i on u.id = i.user_id
// where date_trunc('day', u.created_at) > '${params.iso_timestamp_start}'
// group by timestamp, provider
// order by timestamp desc
//         `,
//       },
//       failedMigrations: {
//         queryType: 'logs',
//         sql: `
// select count(f.id)
// from auth_logs
// where json_value(f.event_message, "$.level") = "fatal"
//   and regexp_contains(f.event_message, "error executing migrations")
// limit 1
// `,
//       },
//       dailyActiveUsers: {
//         queryType: 'logs',
//         sql: `
// select
//   timestamp_trunc(timestamp, day) as timestamp,
//   count(distinct json_value(f.event_message, "$.user_id")) as count
// from auth_logs f
// where json_value(f.event_message, "$.action") = "login"
// group by
//   timestamp
// order by
//   timestamp desc
// `,
//       },
//       cumulativeUsers: {
//         queryType: 'db',
//         sql: (params) => `

// select
//   date_trunc('day', u.created_at) as timestamp,
//   sum(count(u.id)) over (order by date_trunc('day', u.created_at)) as count
// from auth.users as u
// where u.confirmed_at is not null and date_trunc('day', u.created_at) > '${params.iso_timestamp_start}'
// group by timestamp
// order by timestamp desc
//         `,
//       },
//       newUsers: {
//         queryType: 'db',
//         sql: (params) => `
// select
// date_trunc('day', u.created_at) as timestamp,
// count(u.id) as count
// from auth.users as u
// where u.confirmed_at is not null and date_trunc('day', u.created_at) > '${params.iso_timestamp_start}'
// group by
//   timestamp
// order by
//   timestamp desc
// `,
//       },
//     },
//   },
//   [Presets.STORAGE]: {
//     title: 'Storage',
//     queries: {
//       largestObjectsPerBucket: {
//         queryType: 'db',
//         sql: (_params) => `
// select *
// from (
//     SELECT
//       name,
//       metadata->>'mimetype' as mimetype,
//       bucket_id,
//       (metadata->>'size')::bigint as size,
//       row_number() over (partition by bucket_id ORDER BY (metadata->>'size')::bigint DESC ) AS row
//     FROM storage.objects
// ) as f
// where f.row <= 10
// order by size desc`,
//       },
//       topDownloaded: {
//         queryType: 'logs',
//         sql: `
// select
//   count(f.id) as count,
//   r.path as path
// from edge_logs f
// cross join unnest(f.metadata) as m
// cross join unnest(m.request) as r
// where starts_with(r.path, '/storage/v1/object') and r.method = 'GET'
// group by  path
// order by count desc
// `,
//       },
//       mostFiles: {
//         queryType: 'db',
//         sql: () => `
// select owner,
// count(id) as file_count,
// sum((metadata->>'size')::bigint)::bigint as total_size
// from storage.objects
// where owner is not null
// group by owner
// order by total_size desc
//         `,
//       },
//       staleFiles: {
//         queryType: 'db',
//         sql: () => `
// select
// count(id) filter (where last_accessed_at < (NOW() - interval '1 month') ) as one_month,
// count(id) filter (where last_accessed_at < (NOW() - interval '3 month') ) as three_month,
// count(id) filter (where last_accessed_at < (NOW() - interval '6 month') ) as six_month,
// count(id) filter (where last_accessed_at < (NOW() - interval '1 year') ) as twelve_month
// from storage.objects
//         `,
//       },
//       topSizes: {
//         queryType: 'logs',
//         sql: `
// SELECT
// count(f.id) as count,
// r.search as search
// from edge_logs  f
// cross join unnest(f.metadata) as m
// cross join unnest(m.request) as r
// where starts_with(r.path, '/storage/v1/object')
// and r.method = 'GET'
// and regexp_contains(r.search, 'width|height')
// group by search
// order by count desc
//         `,
//       },
//       cacheHitRate: {
//         queryType: 'logs',
//         sql: `
// SELECT
// timestamp_trunc(timestamp, hour) as timestamp,
// countif( h.cf_cache_status in ('HIT', 'STALE', 'REVALIDATED', 'UPDATING') ) as hit_count,
// countif( h.cf_cache_status in ('MISS', 'NONE/UNKNOWN', 'EXPIRED', 'BYPASS', 'DYNAMIC') ) as miss_count
// from edge_logs f
// cross join unnest(f.metadata) as m
// cross join unnest(m.request) as r
// cross join unnest(m.response) as res
// cross join unnest(res.headers) as h
// where starts_with(r.path, '/storage/v1/object')
// and r.method = 'GET'
// group by timestamp
// order by timestamp desc
// `,
//       },
// },
// },

export const DATETIME_FORMAT = 'MMM D, ha'
