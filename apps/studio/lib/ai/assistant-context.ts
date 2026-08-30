import {
  buildClickhouseLogsSchemaSection,
  CLICKHOUSE_LOGS_COMPLETION_INSTRUCTIONS,
} from '@/lib/ai/clickhouse-logs'

/**
 * Stands in for the schema list when the org hasn't opted into sharing schemas.
 * Doubles as a sentinel — "no project context worth sending" is decided by
 * comparing against this exact sentence — so the producer and the comparison have
 * to agree on it, hence one exported constant instead of copies per call site.
 */
export const NO_SCHEMA_ACCESS_MESSAGE = "You don't have access to any schemas."

/**
 * A request-scoped context message, sent as an assistant turn ahead of the
 * conversation. Deliberately NOT part of the system prompt: the system prompt is
 * static so Bedrock can cache it, and anything derived from the current project,
 * chat, or open editor tab would break that cache.
 */
export type AssistantContextMessage = { role: 'assistant'; content: string }

/**
 * Tells the model that the snippet in the SQL editor targets the logs backend, so
 * SQL it writes for that snippet comes back as ClickHouse for the `logs` table
 * rather than Postgres. Carries the same dialect rules and table reference the
 * inline editor completions use, so there's one description of the logs schema.
 */
function buildLogsSnippetContext(): string {
  return [
    "Some SQL snippets are marked with the dialect 'clickhouse', which means they query the Supabase logs backend, not the Postgres database. Any SQL you write, edit, or debug for that snippet must be ClickHouse SQL against the logs table described below — the database schema and the Postgres tools don't apply to it. To run a logs query, load `logs` knowledge then call `query_logs`; do not use `execute_sql`. Postgres SQL is still the right answer for anything else the user asks about their database, or for non-ClickHouse marked queries.",
    CLICKHOUSE_LOGS_COMPLETION_INSTRUCTIONS.trim(),
    buildClickhouseLogsSchemaSection().trim(),
  ].join('\n\n')
}

/**
 * Assemble the context messages that precede the conversation: what project and
 * chat this is, whether it's a support chat, and which backend the open SQL editor
 * snippet targets. Pure and per-request — see {@link AssistantContextMessage} for
 * why none of this belongs in the system prompt.
 */
export function buildAssistantContextMessages({
  projectRef,
  chatName,
  schemasString,
  supportMode,
  includesLogsSnippets,
  now = new Date(),
}: {
  projectRef?: string
  chatName?: string
  schemasString: string
  supportMode?: boolean
  /** Whether any user message in the conversation attached a logs (ClickHouse) query. */
  includesLogsSnippets?: boolean
  /** Injected so tests can pin the clock. Lives here, not the system prompt, so Bedrock can cache the system prompt. */
  now?: Date
}): AssistantContextMessage[] {
  const messages: AssistantContextMessage[] = []

  const hasProjectContext = !!projectRef || !!chatName || schemasString !== NO_SCHEMA_ACCESS_MESSAGE
  if (hasProjectContext) {
    messages.push({
      role: 'assistant',
      content: `The user's current project is ${projectRef || 'unknown'}. Their available schemas are: ${schemasString}. The current chat name is: ${chatName || 'unnamed'}. The current time is ${now.toISOString()} (UTC). Use this clock when converting relative ranges such as "last hour" into iso_timestamp_start and iso_timestamp_end.`,
    })
  }

  if (supportMode) {
    messages.push({
      role: 'assistant',
      content:
        'This is an active support chat. Help the user while they wait for a human agent. Keep guidance practical and concise. If the user asks for a human, or if the issue cannot be safely resolved, call escalate_to_human with a short reason. Only call resolve_support_conversation after the user explicitly confirms the issue is resolved; otherwise keep helping.',
    })
  }

  if (includesLogsSnippets) {
    messages.push({ role: 'assistant', content: buildLogsSnippetContext() })
  }

  return messages
}
