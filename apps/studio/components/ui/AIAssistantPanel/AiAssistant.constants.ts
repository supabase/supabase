import { SupportedAssistantEntities } from './AIAssistant.types'

export const ASSISTANT_ERRORS = {
  'context-exceeded': {
    message:
      'This conversation has become too long for the Assistant to process. Please start a new chat to continue.',
  },
  default: {
    message: 'If the error persists while retrying, you may try creating a new chat and try again.',
  },
}

export const ASSISTANT_SUPPORT_ENTITIES: {
  id: SupportedAssistantEntities
  label: string
  name: string
}[] = [
  { id: 'rls-policies', label: 'RLS Policies', name: 'RLS policy' },
  { id: 'functions', label: 'Functions', name: 'database function' },
]

export const SAFE_FUNCTIONS = [
  'count(',
  'sum(',
  'avg(',
  'min(',
  'max(',
  'coalesce(',
  'nullif(',
  'current_timestamp',
  'current_date',
  'length(',
  'lower(',
  'upper(',
  'trim(',
  'substring(',
  'to_char(',
  'to_date(',
  'extract(',
  'date(',
  'date_trunc(',
  'string_agg(',
  'in (',
  'now(',
  'left(',
]
