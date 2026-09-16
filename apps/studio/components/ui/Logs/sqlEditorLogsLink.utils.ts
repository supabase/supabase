import dayjs from 'dayjs'

/**
 * Padding on each side of a run. Postgres logs a statement when it finishes, so
 * padding back covers long-running queries whose log line predates the result
 * arriving; padding forward covers log ingestion lag.
 */
const WINDOW_PADDING_MINUTES = 2

/**
 * Deep link to the Postgres logs for a SQL editor run. The pg-meta query
 * endpoint returns rows only — a statement that raises a `WARNING` or `NOTICE`
 * still comes back as a plain success — so the logs are the only place those
 * lines surface.
 */
export function getSqlEditorLogsUrl({
  projectRef,
  executedAt,
}: {
  projectRef: string
  /** When the run resolved, as epoch millis. */
  executedAt: number
}): string {
  const at = dayjs(executedAt)
  const from = at.subtract(WINDOW_PADDING_MINUTES, 'minute').toISOString()
  const to = at.add(WINDOW_PADDING_MINUTES, 'minute').toISOString()

  return `/project/${projectRef}/logs/postgres-logs?its=${encodeURIComponent(from)}&ite=${encodeURIComponent(to)}`
}
