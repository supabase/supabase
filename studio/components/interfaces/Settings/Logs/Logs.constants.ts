import { LogTemplate } from '.'

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
    mode: 'custom',
    searchString: `SELECT
    p.user_name, count(*) as count
FROM postgres_logs
  LEFT JOIN UNNEST(metadata) as m ON TRUE
  LEFT JOIN UNNEST(m.parsed) AS p ON TRUE
WHERE
  REGEXP_CONTAINS(event_message, 'COMMIT')
GROUP BY
  p.user_name
    `,
    for: ['database'],
  },
  {
    label: 'Metadata IP',
    mode: 'custom',
    searchString: `SELECT timestamp, h.x_real_ip
FROM edge_logs
  LEFT JOIN UNNEST(metadata) as m ON TRUE
  LEFT JOIN UNNEST(m.request) AS r ON TRUE
  LEFT JOIN UNNEST(r.headers) AS h ON TRUE
WHERE h.x_real_ip IS NOT NULL
`,
    for: ['api'],
  },
  {
    label: 'Requests by Country',
    mode: 'custom',
    searchString: `SELECT 
  cf.country, count(*) as count
FROM edge_logs
  LEFT JOIN UNNEST(metadata) as m ON TRUE
  LEFT JOIN UNNEST(m.request) AS r ON TRUE
  LEFT JOIN UNNEST(r.cf) AS cf ON TRUE
GROUP BY
  cf.country
ORDER BY
  count DESC
`,
    for: ['api'],
  },
  {
    label: 'Slow Response Time',
    mode: 'custom',
    searchString: `select
  timestamp, 
  event_message,
  r.origin_time
FROM edge_logs
  CROSS JOIN unnest(metadata) as m 
  CROSS JOIN unnest(m.response) as r
WHERE
  r.origin_time > 1000
ORDER BY
  timestamp DESC
LIMIT 100
`,
    for: ['api'],
  },
  {
    label: '500 Request Codes',
    mode: 'custom',
    searchString: `SELECT
  timestamp, 
  event_message,
  r.status_code
FROM edge_logs
  cross join unnest(metadata) as m 
  cross join unnest(m.response) as r
WHERE
  r.status_code >= 500
ORDER BY
  timestamp desc
LIMIT 100
`,
    for: ['api'],
  },
  {
    label: 'Top Paths',
    mode: 'custom',
    searchString: `SELECT
  r.path as path,
  r.search as params,
  count(timestamp) as c
FROM edge_logs
  cross join unnest(metadata) as m 
  cross join unnest(m.request) as r
GROUP BY 
  path,
  params 
ORDER BY
  c desc
LIMIT 100
`,
    for: ['api'],
  },
  {
    label: 'REST Requests',
    mode: 'custom',
    searchString: `SELECT
  timestamp,
  event_message
FROM edge_logs
  cross join unnest(metadata) as m 
  cross join unnest(m.request) as r
WHERE
  path like '%rest/v1%'
ORDER BY
  timestamp desc
LIMIT 100
`,
    for: ['api'],
  },
  {
    label: 'Errors',
    mode: 'custom',
    searchString: `SELECT
  t.timestamp,
  p.error_severity,
  event_message
FROM
  postgres_logs as t
    cross join unnest(metadata) as m
    cross join unnest(m.parsed) as p
WHERE
  p.error_severity in ('ERROR', 'FATAL', 'PANIC')
ORDER BY
  timestamp desc
LIMIT 100
`,
    for: ['database'],
  },
  {
    label: 'Error Count by User',
    mode: 'custom',
    searchString: `SELECT
  count(t.timestamp) as count,
  p.user_name,
  p.error_severity
FROM
  postgres_logs as t
    cross join unnest(metadata) as m
    cross join unnest(m.parsed) as p
WHERE
  p.error_severity in ('ERROR', 'FATAL', 'PANIC')
GROUP BY
  p.user_name,
  p.error_severity
ORDER BY
  count desc
LIMIT 100
`,
    for: ['database'],
  },
]

export const LOG_TYPE_LABEL_MAPPING: { [k: string]: string } = {
  explorer: "Explorer",
  api: 'API',
  database: 'Database',
}

export const genDefaultQuery = (table: string, where: string = ''): string => `SELECT 
  id, timestamp, event_message, metadata 
FROM
  ${table}${where ? ' WHERE\n  ' + where : ''} 
LIMIT 100
`
export const cleanQuery = (str: string) => str.replace(/\n/g, ' ')
// .replace(/\n.*\-\-.*(\n)?$?/, "")


export enum LogsTableName {
  EDGE = 'edge_logs',
  POSTGRES = 'postgres_logs',
}
export const genCountQuery = (table: string): string => `SELECT count(*) as count FROM ${table}`

export const genQueryParams = (params: { [k: string ]: string }) => {
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
