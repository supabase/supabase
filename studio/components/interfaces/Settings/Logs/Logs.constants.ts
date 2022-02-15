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
    label: '10 Minutes Ago',
    mode: 'simple',
    searchString: 'timestamp < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 10 MINUTE)',
    for: ['database', 'api'],
  },
  {
    label: 'POST or PATCH',
    mode: 'custom',
    searchString:
      "REGEXP_CONTAINS(event_message, 'POST') OR REGEXP_CONTAINS(event_message, 'PATCH')",
    for: ['api'],
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
    for: ['database'],
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
  DESC count
`,
    for: ['api'],
  },
]

export const LOG_TYPE_LABEL_MAPPING: { [k: string]: string } = {
  api: 'API',
  database: 'Database',
}
