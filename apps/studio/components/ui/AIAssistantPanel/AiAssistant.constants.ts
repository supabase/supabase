import { SupportedAssistantEntities } from './AIAssistant.types'

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
  'date_trunc(',
  'string_agg(',
]
