import { EdgeFunctions, RESTApi, SqlEditor } from 'icons'
import { ScrollText } from 'lucide-react'

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
