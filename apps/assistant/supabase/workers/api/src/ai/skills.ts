import type { AgentSkill } from '@supabase/agent-runtime'

import {
  EDGE_FUNCTION_PROMPT,
  LOGS_PROMPT,
  PG_BEST_PRACTICES,
  REALTIME_PROMPT,
  RLS_PROMPT,
  STORAGE_PROMPT,
} from './prompts'

/** Application-owned knowledge; only the catalog is included in the system instructions. */
export const assistantSkills = [
  {
    name: 'pg_best_practices',
    description:
      'PostgreSQL best practices. Always load before writing any SQL, even simple queries.',
    load: () => PG_BEST_PRACTICES,
  },
  {
    name: 'logs',
    description:
      "ClickHouse SQL against the project's logs table. Always load before calling query_logs.",
    load: () => LOGS_PROMPT,
  },
  {
    name: 'rls',
    description: 'Row Level Security policies. Load before writing or explaining RLS policies.',
    load: () => RLS_PROMPT,
  },
  {
    name: 'storage',
    description:
      'Supabase Storage buckets and access policies. Always load before creating buckets or storage.objects policies.',
    load: () => STORAGE_PROMPT,
  },
  {
    name: 'edge_functions',
    description: 'Supabase Edge Functions. Load before writing or deploying Edge Functions.',
    load: () => EDGE_FUNCTION_PROMPT,
  },
  {
    name: 'realtime',
    description: 'Supabase Realtime. Load before implementing or troubleshooting Realtime.',
    load: () => REALTIME_PROMPT,
  },
] satisfies readonly AgentSkill[]
