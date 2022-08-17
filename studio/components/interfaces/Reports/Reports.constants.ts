import dayjs from 'dayjs'
import { DatetimeHelper } from '../Settings/Logs'
import { Presets } from './Reports.types'

export const REPORTS_DATEPICKER_HELPERS: DatetimeHelper[] = [
  // {
  //     text: 'Last 1 day',
  //     calcFrom: () => dayjs().subtract(1, 'day').startOf('day').toISOString(),
  //     calcTo: () => '',
  // },
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
  },
  {
    text: 'Last 30 days',
    calcFrom: () => dayjs().subtract(30, 'day').startOf('day').toISOString(),
    calcTo: () => '',
  },
  {
    text: 'Last 90 days',
    calcFrom: () => dayjs().subtract(90, 'day').startOf('day').toISOString(),
    calcTo: () => '',
  },
]

export const PRESET_CONFIG = {
  [Presets.OVERVIEW]: {
    title: 'API Usage',
    sql: {
      statusCodes: `
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
      requestPaths: `
  select
    f2.path as path,
    f2.search as query_params,
    f2.method as method,
    f3.status_code as status_code,
    avg(f3.origin_time) as avg_origin_time,
    sum(f3.origin_time) as sum,
    --APPROX_QUANTILES(f3.origin_time, 100) as p95_array,
    --APPROX_QUANTILES(f3.origin_time, 100) as p99_array,
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
`
    },
  },
}

export const DATETIME_FORMAT = 'MMM D, ha'
