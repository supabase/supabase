import { EdgeFunctions, RESTApi, SqlEditor } from 'icons'
import { ScrollText } from 'lucide-react'

const cronField = /(\*|(\d+|\*\/\d+)|\d+\/\d+|\d+-\d+|\d+(,\d+)*)/
const cronDayOfMonth = /(\*|\$|(\d+|\*\/\d+)|\d+\/\d+|\d+-\d+|\d+(,\d+)*)/
export const cronPattern = new RegExp(
  `^${cronField.source}\\s+${cronField.source}\\s+${cronDayOfMonth.source}\\s+${cronField.source}\\s+${cronField.source}$`
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

type CronTableColumn = {
  id: string
  name: string
  width?: number
  minWidth?: number
  maxWidth?: number
  resizable?: boolean
}

export const CRON_TABLE_COLUMNS: CronTableColumn[] = [
  { id: 'jobname', name: 'Name', minWidth: 160, width: 200, resizable: true },
  { id: 'schedule', name: 'Schedule', width: 100, resizable: true },
  { id: 'latest_run', name: 'Last run', width: 265, resizable: true },
  { id: 'next_run', name: 'Next run', minWidth: 180, resizable: true },
  { id: 'command', name: 'Command', minWidth: 320, resizable: true },
  { id: 'active', name: 'Active', width: 70, minWidth: 70, maxWidth: 70, resizable: false },
  { id: 'actions', name: '', minWidth: 75, width: 75, resizable: false },
]
