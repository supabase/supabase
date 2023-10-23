import { BASE_PATH, IS_PLATFORM } from 'lib/constants'

export const ENABLED_MODE_OPTIONS = [
  { label: 'Origin', value: 'ORIGIN', description: 'This is the default behaviour' },
  {
    label: 'Replica',
    value: 'REPLICA',
    description: 'Will only fire if the session is in “replica” mode',
  },
  {
    label: 'Always',
    value: 'ALWAYS',
    description: 'Will fire regardless of the current replication role',
  },
  { label: 'Disabled', value: 'DISABLED', description: 'Will not fire' },
]

export const HOOK_EVENTS = [
  {
    label: 'Insert',
    value: 'INSERT',
    description: 'Any insert operation on the table',
  },
  {
    label: 'Update',
    value: 'UPDATE',
    description: 'Any update operation, of any column in the table',
  },
  {
    label: 'Delete',
    value: 'DELETE',
    description: 'Any deletion of a record',
  },
]

export const AVAILABLE_WEBHOOK_TYPES = [
  {
    value: 'http_request',
    icon: `${BASE_PATH}/img/function-providers/http-request.png`,
    label: 'HTTP Request',
    description: 'Send an HTTP request to any URL.',
  },
  ...(IS_PLATFORM
    ? [
        {
          value: 'supabase_function',
          icon: `${BASE_PATH}/img/function-providers/supabase-severless-function.png`,
          label: 'Supabase Edge Functions',
          description: 'Choose a Supabase edge function to run.',
        },
      ]
    : []),
]
