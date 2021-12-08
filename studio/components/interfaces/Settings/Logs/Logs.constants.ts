import { LogTemplate } from '.'

export const TEMPLATES: LogTemplate[] = [
  { label: 'Recent Errors', mode: 'simple', searchString: '[Ee]rror|\\s[45][0-9][0-9]\\s' },
  {
    label: 'POST or PATCH',
    mode: 'custom',
    searchString:
      "REGEXP_CONTAINS(event_message, 'POST') OR REGEXP_CONTAINS(event_message, 'PATCH')",
  },
]

export const DEFAULT_QUERY = 'SELECT timestamp, event_message FROM postgres_logs;'
