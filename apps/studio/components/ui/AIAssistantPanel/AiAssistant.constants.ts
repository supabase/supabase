import { SupportedAssistantEntities } from './AIAssistant.types'

export const ASSISTANT_SUPPORT_ENTITIES: {
  id: SupportedAssistantEntities
  label: string
  name: string
}[] = [
  { id: 'rls-policies', label: 'RLS Policies', name: 'RLS policy' },
  { id: 'functions', label: 'Functions', name: 'database function' },
]
