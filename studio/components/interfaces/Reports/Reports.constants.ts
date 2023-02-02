import dayjs from 'dayjs'
import { DatetimeHelper } from '../Settings/Logs'
import { PresetConfig, Presets } from './Reports.types'

export const LAYOUT_COLUMN_COUNT = 24

export const REPORTS_DATEPICKER_HELPERS: DatetimeHelper[] = [
  {
    text: 'Last 7 days',
    calcFrom: () => dayjs().subtract(7, 'day').startOf('day').toISOString(),
    calcTo: () => '',
    default: true,
  },
  {
    text: 'Last 14 days',
    calcFrom: () => dayjs().subtract(7, 'day').startOf('day').toISOString(),
    calcTo: () => '',
    default: true,
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

export const PRESET_CONFIG: Record<Presets, PresetConfig> = {
  [Presets.API]: {
    title: 'API',
    queries: {
      statusCodes: {
        queryType: 'logs',
        sql: `
        select
          timestamp_trunc(timestamp, hour) as timestamp,
          r.status_code as status_code,
          count(status_code) as count
        FROM
          edge_logs
        CROSS JOIN UNNEST(metadata) AS m
        CROSS JOIN UNNEST(m.response) AS r
        GROUP BY
          timestamp,
          status_code
        ORDER BY
          timestamp ASC`,
      },
      errorRates: {
        queryType: 'logs',
        sql: `
        select
          timestamp_trunc(timestamp, hour) as timestamp,
          count(timestamp) as count
        FROM
          edge_logs
          LEFT JOIN UNNEST(metadata) AS f1 ON TRUE
          LEFT JOIN UNNEST(f1.response) AS f3 ON TRUE
        WHERE
          f3.status_code >= 400
        GROUP BY
          timestamp
        ORDER BY
          timestamp ASC
        `,
      },
      requestPaths: {
        queryType: 'logs',
        sql: `
        select
          f2.path as path,
          f2.search as query_params,
          f2.method as method,
          f3.status_code as status_code,
          avg(f3.origin_time) as avg_origin_time,
          sum(f3.origin_time) as sum,
          APPROX_QUANTILES(f3.origin_time, 100) as quantiles,
          count(timestamp) as count
        FROM
          edge_logs
          LEFT JOIN UNNEST(metadata) AS f1 ON TRUE
          LEFT JOIN UNNEST(f1.request) AS f2 ON TRUE
          LEFT JOIN UNNEST(f1.response) AS f3 ON TRUE
        GROUP BY
          path,
          query_params,
          method,
          status_code
        ORDER BY
          sum DESC,
          count desc,
          avg_origin_time DESC
        LIMIT 50
      `,
      },
      userAgents: {
        queryType: 'logs',
        sql: `
        select
          h.user_agent as user_agent,
          cf.asOrganization as request_source,
          count(f.id) as count
        from
          edge_logs as f
          cross join unnest(f.metadata) as m
          cross join unnest(m.request) as r
          cross join unnest(r.cf) as cf
          cross join unnest(r.headers) as h
        group by
          user_agent,
          request_source
        order by
          count desc
        limit 12
        `,
      },
      botScores: {
        queryType: 'logs',
        sql: `
        select
          h.cf_connecting_ip as ip,
          h.cf_ipcountry as country,
          h.user_agent as user_agent,
          r.path as path,
          b.score as bot_score,
          b.verifiedBot as bot_verified,
          count(f.id) as count
        from
          edge_logs as f
          cross join unnest(f.metadata) as m
          cross join unnest(m.request) as r
          cross join unnest(r.cf) as cf
          cross join unnest(r.headers) as h
          cross join unnest(cf.botManagement) as b
        group by
          ip,
          country,
          path,
          user_agent,
          bot_score,
          bot_verified
        order by
          bot_score desc
        limit 20
              `,
      },
    },
  },
  [Presets.AUTH]: {
    title: 'Auth',
    queries: {
      bannedUsers: {
        queryType: 'db',
        sql: (_params) => `
select 
  count(distinct u.id) as count
from auth.users u
where u.banned_until is not null and u.banned_until > now()
limit 1
        `,
      },
      unverifiedUsers: {
        queryType: 'db',
        sql: (params) => `
select 
  date_trunc('day', u.created_at) as timestamp,
  count(distinct u.id) as count
from auth.users u
where u.confirmed_at is null and '${params.iso_timestamp_start}' < u.created_at 
group by timestamp
order by timestamp desc
        `,
      },
      signUpProviders: {
        queryType: 'db',
        sql: (params) => `
select 
  sum(count(u.id)) over (order by date_trunc('day', u.created_at)) as count, 
  date_trunc('day', u.created_at) as timestamp, 
  i.provider as provider
from auth.users u
join auth.identities as i on u.id = i.user_id
where date_trunc('day', u.created_at) > '${params.iso_timestamp_start}'
group by timestamp, provider
order by timestamp desc
        `,
      },
      failedMigrations: {
        queryType: 'logs',
        sql: `
select count(f.id)
from auth_logs
where json_value(f.event_message, "$.level") = "fatal"
  and regexp_contains(f.event_message, "error executing migrations") 
limit 1
`,
      },
      dailyActiveUsers: {
        queryType: 'logs',
        sql: `
select 
  timestamp_trunc(timestamp, day) as timestamp,
  count(distinct json_value(f.event_message, "$.user_id")) as count
from auth_logs f
where json_value(f.event_message, "$.action") = "login"
group by 
  timestamp
order by
  timestamp desc
`,
      },
      cumulativeUsers: {
        queryType: 'db',
        sql: (params) => `
        
select 
  date_trunc('day', u.created_at) as timestamp, 
  sum(count(u.id)) over (order by date_trunc('day', u.created_at)) as count
from auth.users as u
where u.confirmed_at is not null and date_trunc('day', u.created_at) > '${params.iso_timestamp_start}'
group by timestamp
order by timestamp desc
        `,
      },
      newUsers: {
        queryType: 'db',
        sql: (params) => `
select 
date_trunc('day', u.created_at) as timestamp,
count(u.id) as count
from auth.users as u
where u.confirmed_at is not null and date_trunc('day', u.created_at) > '${params.iso_timestamp_start}'
group by 
  timestamp
order by
  timestamp desc
`,
      },
    },
  },
}

export const DATETIME_FORMAT = 'MMM D, ha'
