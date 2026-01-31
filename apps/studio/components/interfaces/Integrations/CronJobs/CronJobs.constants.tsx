import { EdgeFunctions, RESTApi, SqlEditor } from 'icons'
import { ScrollText } from 'lucide-react'

// Standard cron field pattern (no $)
const cronFieldPattern = '(\\*|(\\d+|\\*\\/\\d+)|\\d+\\/\\d+|\\d+-\\d+|\\d+(,\\d+)*)'
// Day-of-month field pattern (allows $ for pg_cron's "last day of month")
const dayOfMonthPattern = '(\\*|\\$|(\\d+|\\*\\/\\d+)|\\d+\\/\\d+|\\d+-\\d+|\\d+(,\\d+)*)'

// Cron pattern: minute hour day-of-month month day-of-week
// Only day-of-month (3rd field) supports $ for pg_cron's "last day of month" syntax
export const cronPattern = new RegExp(
  `^${cronFieldPattern}\\s+${cronFieldPattern}\\s+${dayOfMonthPattern}\\s+${cronFieldPattern}\\s+${cronFieldPattern}$`
)

// detect seconds like "10 seconds" or normal cron syntax like "*/5 * * * *"
export const secondsPattern = /^\d+\s+seconds*$/

export const CRONJOB_TYPES = [
  'http_request',
  'edge_function',
  'sql_function',
  'sql_snippet',
] as const

export const CRONJOB_DEFINITIONS = [
  {
    value: 'sql_snippet',
    icon: <SqlEditor strokeWidth={1} />,
    label: 'SQL Snippet',
    description: 'Write a SQL snippet to run.',
  },
  {
    value: 'sql_function',
    icon: <ScrollText strokeWidth={1} />,
    label: 'Database function',
    description: 'Choose a database function to run.',
  },

  {
    value: 'http_request',
    icon: <RESTApi strokeWidth={1} />,
    label: 'HTTP Request',
    description: 'Send an HTTP request to any URL.',
  },
  {
    value: 'edge_function',
    icon: <EdgeFunctions strokeWidth={1} />,
    label: 'Supabase Edge Function',
    description: 'Choose a Supabase edge function to run.',
  },
]

export type HTTPHeader = { name: string; value: string }

export type HTTPParameter = { name: string; value: string }

export const CRON_TABLE_COLUMNS = [
  { id: 'jobname', name: 'Name', minWidth: 0, width: 200 },
  { id: 'schedule', name: 'Schedule', width: 100 },
  { id: 'latest_run', name: 'Last run', width: 265 },
  { id: 'next_run', name: 'Next run', minWidth: 180 },
  { id: 'command', name: 'Command', minWidth: 320 },
  { id: 'active', name: 'Active', width: 70, minWidth: 70, maxWidth: 70 },
  { id: 'actions', name: '', minWidth: 75, width: 75 },
]
