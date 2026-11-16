import { untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'

import { renderAlertIssueNotebook } from './AlertIssueNotebook.utils'
import type { AlertIssue, AlertLogEvents } from '@/data/alert-issues/alert-issue.schema'

/**
 * The scripted Supabase Assistant for alert issues. It simulates an agentic run: a fixed plan of
 * steps, some of which call real tools (read-only SQL, log events), then a templated answer. No
 * language model is involved.
 */

export const ASSISTANT_AUTHOR = 'Supabase Assistant'
export const ASSISTANT_MENTION = '@assistant'

export type AssistantRow = Readonly<Record<string, unknown>>

export type AssistantContext =
  | { kind: 'issue'; label: string }
  | { kind: 'finding'; label: string }
  | { kind: 'log_events'; label: string }
  | { kind: 'sql_cell'; label: string; sql: string; rows?: readonly AssistantRow[] }

export type AssistantStep =
  | { id: string; kind: 'read_finding'; label: string }
  | { id: string; kind: 'run_sql'; label: string; title: string; sql: UntrustedSqlFragment }
  | {
      id: string
      kind: 'reuse_result'
      label: string
      title: string
      rows: readonly AssistantRow[]
    }
  | { id: string; kind: 'read_logs'; label: string }
  | { id: string; kind: 'check_docs'; label: string; url: string }

export type LogEventSummary = {
  total: number
  groups: { label: string; count: number }[]
  slowestMs?: number
  medianMs?: number
}

export type AssistantStepResult =
  | { kind: 'read_finding' }
  | { kind: 'run_sql'; title: string; rows: readonly AssistantRow[] }
  | { kind: 'run_sql'; title: string; error: string }
  | { kind: 'read_logs'; summary: LogEventSummary | null }
  | { kind: 'check_docs'; url: string }

const WRITE_KEYWORDS =
  /\b(insert|update|delete|merge|alter|create|drop|truncate|grant|revoke|comment|vacuum|analyze|copy|call|do|lock|refresh|reindex|cluster|set|reset)\b/i
const MAX_TEMPLATE_QUERIES = 2

/** Only a single SELECT (or WITH … SELECT) statement with no writing keywords. */
export function isReadOnlyQuery(sql: string): boolean {
  const statement = sql.trim().replace(/;\s*$/, '')
  if (statement.includes(';')) return false
  if (!/^(select|with)\b/i.test(statement)) return false
  return !WRITE_KEYWORDS.test(statement.replace(/'(?:[^']|'')*'/g, "''"))
}

export const remediationUrl = (issue: AlertIssue) => {
  const value = issue.metadata.remediation
  return typeof value === 'string' && value.startsWith('https://') ? value : undefined
}

export function buildAssistantPlan(issue: AlertIssue, context: AssistantContext): AssistantStep[] {
  const steps: AssistantStep[] = [
    { id: 'finding', kind: 'read_finding', label: 'Reading the finding' },
  ]

  if (context.kind === 'sql_cell') {
    if (context.rows) {
      steps.push({
        id: 'cell',
        kind: 'reuse_result',
        label: `Reusing the results of "${context.label}"`,
        title: context.label,
        rows: context.rows,
      })
    } else if (isReadOnlyQuery(context.sql)) {
      steps.push({
        id: 'cell',
        kind: 'run_sql',
        label: `Running "${context.label}"`,
        title: context.label,
        sql: untrustedSql(context.sql),
      })
    }
  } else {
    const queries = renderAlertIssueNotebook(issue).flatMap((cell) =>
      cell.status === 'ready' && cell.source === 'database' && isReadOnlyQuery(cell.sql)
        ? [cell]
        : []
    )
    queries.slice(0, MAX_TEMPLATE_QUERIES).forEach((cell, index) =>
      steps.push({
        id: `sql-${index}`,
        kind: 'run_sql',
        label: `Running "${cell.title}"`,
        title: cell.title,
        sql: cell.sql,
      })
    )
    if (context.kind === 'log_events' || queries.length === 0) {
      steps.push({
        id: 'logs',
        kind: 'read_logs',
        label: 'Reading log events from the last 24 hours',
      })
    }
  }

  const url = remediationUrl(issue)
  if (url) steps.push({ id: 'docs', kind: 'check_docs', label: 'Checking the docs', url })
  return steps
}

const statusCode = (body: Record<string, unknown>) => {
  const metadata = body.metadata
  if (typeof metadata !== 'object' || metadata === null) return undefined
  const code = (metadata as Record<string, unknown>).status_code
  return typeof code === 'number' ? code : undefined
}

const executionTime = (body: Record<string, unknown>) => {
  const metadata = body.metadata
  if (typeof metadata !== 'object' || metadata === null) return undefined
  const ms = (metadata as Record<string, unknown>).execution_time_ms
  return typeof ms === 'number' ? ms : undefined
}

export function summarizeLogEvents(events: AlertLogEvents['events']): LogEventSummary {
  const counts = new Map<string, number>()
  for (const event of events) {
    const code = statusCode(event.body)
    const label =
      code === undefined ? (event.event_message ?? 'Unknown event').trim() : `HTTP ${code}`
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  const groups = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, 4)

  const times = events.flatMap((event) => executionTime(event.body) ?? []).sort((a, b) => a - b)
  if (times.length === 0) return { total: events.length, groups }
  return {
    total: events.length,
    groups,
    slowestMs: times[times.length - 1],
    medianMs: times[Math.floor((times.length - 1) / 2)],
  }
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

export function summarizeAssistantRun(results: AssistantStepResult[]): string {
  const queries = results.filter((result) => result.kind === 'run_sql').length
  const parts: string[] = []
  if (queries > 0) parts.push(`ran ${queries === 1 ? '1 query' : `${queries} queries`}`)
  for (const result of results) {
    if (result.kind === 'read_logs' && result.summary) {
      parts.push(`read ${plural(result.summary.total, 'log event')}`)
    }
  }
  if (results.some((result) => result.kind === 'check_docs')) parts.push('checked the docs')
  const summary = parts.length > 0 ? parts.join(' · ') : 'read the finding'
  return summary.charAt(0).toUpperCase() + summary.slice(1)
}

const contextLine = (context: AssistantContext) => {
  switch (context.kind) {
    case 'finding':
      return 'On: the finding'
    case 'log_events':
      return 'On: log events'
    case 'sql_cell':
      return `On: SQL cell "${context.label}"`
    case 'issue':
      return undefined
  }
}

export function buildAssistantPrompt(question: string, context: AssistantContext): string {
  const line = contextLine(context)
  const prompt = `${ASSISTANT_MENTION} ${question.trim()}`
  return line ? `${prompt}\n\n${line}` : prompt
}

const MENTION = /(^|\s)(@assistant)\b/gi

export const mentionsAssistant = (text: string) => new RegExp(MENTION.source, 'i').test(text)

export function splitAssistantMentions(text: string): { text: string; isMention: boolean }[] {
  const parts: { text: string; isMention: boolean }[] = []
  let cursor = 0
  for (const match of text.matchAll(MENTION)) {
    const start = (match.index ?? 0) + match[1].length
    if (start > cursor) parts.push({ text: text.slice(cursor, start), isMention: false })
    parts.push({ text: match[2], isMention: true })
    cursor = start + match[2].length
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor), isMention: false })
  return parts
}

export const buildPersistedReply = (summary: string, answer: string) => `_${summary}_\n\n${answer}`
