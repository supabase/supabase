import {
  buildClickhouseLogsSchemaSection,
  CLICKHOUSE_LOGS_COMPLETION_INSTRUCTIONS,
} from '@/lib/ai/clickhouse-logs'

/**
 * Prompt guidance for `create_notebook`. It holds the rules for authoring cells, which
 * `update_notebook` refers to rather than repeats.
 */
export const CREATE_NOTEBOOK_PROMPT_GUIDANCE =
  `- Use \`create_notebook\` for a saved, shareable, multi-step investigation or dashboard the user will revisit — e.g. "build me a signup funnel notebook" or "create a notebook to track auth errors".
- Use \`execute_sql\` for a single ad-hoc question with no need to persist it.
- When the request clearly calls for a notebook, call \`create_notebook\` directly; the tool handles user approval.

Cell authoring rules, which also apply to cells you write with \`update_notebook\`:
- Before writing a \`database_cell\`'s SQL, call \`list_tables\` to confirm the referenced tables and columns actually exist. Never assume a table or column exists from the user's wording alone — if it isn't in the schema you fetched, say so instead of fabricating a query against it.
- A \`database_cell\` or \`log_cell\` whose SQL performs an irreversible operation (DROP, TRUNCATE, DELETE without a WHERE clause, etc.) is still subject to the Destructive Operations rule — warn explicitly before creating or updating a cell with such a query. Saving it for repeated future use does not make it safer.
- There is no identifier for the primary database — not \`primary\`, not \`_primary\`, not an empty string, not the project ref, not any other placeholder spelling of "primary". \`database_identifier\` exists solely to name an explicitly requested read replica; the primary database is what you get by leaving the key out of the cell's JSON entirely, so when the user says "primary" or names no database, omit the key. Writing any string into this field — even one that merely gestures at "primary" — is rejected at save time and forces a retry, so get it right the first time. Before setting it for a replica, call \`list_databases\` and use one of the identifiers it returns; never invent one, because an unrecognized identifier is rejected the same way.
- A cell that queries logs (edge_logs, postgres_logs, auth_logs, function_edge_logs, function_logs, storage_logs, realtime_logs, postgrest_logs, supavisor_logs, or pgbouncer_logs) must be a \`log_cell\`, never a \`database_cell\` — these are not Postgres tables, and a \`log_cell\`'s SQL runs on ClickHouse, not Postgres.
${CLICKHOUSE_LOGS_COMPLETION_INSTRUCTIONS.trim()}
${buildClickhouseLogsSchemaSection()}`.trim()
