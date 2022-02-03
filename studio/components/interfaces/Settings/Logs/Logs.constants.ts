import { LogTemplate } from '.'

export const TEMPLATES: LogTemplate[] = [
  { label: 'Recent Errors', mode: 'simple', searchString: '[Ee]rror|\\s[45][0-9][0-9]\\s' },
  {
    label: 'POST or PATCH',
    mode: 'custom',
    searchString:
      "REGEXP_CONTAINS(event_message, 'POST') OR REGEXP_CONTAINS(event_message, 'PATCH')",
  },
  {
    label: 'Metadata IP',
    mode: 'custom',
    searchString:
      `SELECT timestamp, h.x_real_ip
FROM edge_logs
  LEFT JOIN UNNEST(metadata) as m ON TRUE
  LEFT JOIN UNNEST(m.request) AS r ON TRUE
  LEFT JOIN UNNEST(r.headers) AS h ON TRUE
WHERE h.x_real_ip IS NOT NULL
`,
  },
]

export const DEFAULT_QUERY = 'SELECT timestamp, event_message FROM postgres_logs;'
