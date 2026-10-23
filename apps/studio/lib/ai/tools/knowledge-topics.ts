/** Topics `load_knowledge` can load, with how the UI refers to each. Prompt text lives server-side. */
export const KNOWLEDGE_TOPIC_LABELS = {
  pg_best_practices: 'Postgres best practices',
  rls: 'RLS',
  storage: 'Storage',
  edge_functions: 'Edge Functions',
  realtime: 'Realtime',
  logs: 'logs',
} as const

export type KnowledgeName = keyof typeof KNOWLEDGE_TOPIC_LABELS
