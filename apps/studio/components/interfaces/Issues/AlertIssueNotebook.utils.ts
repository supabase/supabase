import { ident, literal, untrustedSql, type UntrustedSqlFragment } from '@supabase/pg-meta'

import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'
import {
  analyticsLiteral,
  quotedIdent,
  untrustedLogSql,
  type UntrustedLogSqlFragment,
} from '@/data/logs/safe-analytics-sql'

type Source = 'database' | 'logs'

/**
 * A notebook cell rendered from an alert rule's SQL template. Templates come from the alert
 * rule, not from the user, so the rendered SQL stays untrusted: it is shown in an editor and
 * only runs after the user clicks Run.
 */
export type RenderedAlertIssueCell =
  | { status: 'ready'; title: string; source: 'database'; sql: UntrustedSqlFragment }
  | { status: 'ready'; title: string; source: 'logs'; sql: UntrustedLogSqlFragment }
  | { status: 'invalid'; title: string; source: Source; template: string; reason: string }

const PLACEHOLDER = /\{\{\s*([^{}]*?)\s*\}\}/g
const QUOTED_PLACEHOLDER = /^(ident|literal):([a-zA-Z0-9_.-]+)$/

class TemplateError extends Error {}

const quote = (source: Source, kind: string, value: string): string => {
  if (source === 'database') return kind === 'ident' ? ident(value) : literal(value)

  if (kind === 'literal') return analyticsLiteral(value)
  try {
    return quotedIdent(value)
  } catch {
    throw new TemplateError(`"${value}" is not a valid log field name.`)
  }
}

const renderTemplate = (
  template: string,
  source: Source,
  identifiers: AlertIssue['identifiers']
): string =>
  template.replace(PLACEHOLDER, (placeholder: string, inner: string) => {
    const match = QUOTED_PLACEHOLDER.exec(inner)
    if (!match) {
      throw new TemplateError(
        `Unsupported placeholder ${placeholder}. Use {{ident:key}} or {{literal:key}}.`
      )
    }

    const [, kind, key] = match
    const value = identifiers[key]
    if (value === undefined || value === null) {
      throw new TemplateError(`This alert issue has no "${key}" identifier.`)
    }

    return quote(source, kind, value)
  })

export function renderAlertIssueNotebook(issue: AlertIssue): RenderedAlertIssueCell[] {
  return (issue.notebook ?? []).map(({ title, source, sql: template }) => {
    try {
      const sql = renderTemplate(template, source, issue.identifiers)
      return source === 'database'
        ? { status: 'ready', title, source, sql: untrustedSql(sql) }
        : { status: 'ready', title, source, sql: untrustedLogSql(sql) }
    } catch (error) {
      if (!(error instanceof TemplateError)) throw error
      return { status: 'invalid', title, source, template, reason: error.message }
    }
  })
}

export type AlertIssueNotebookDraftCell =
  | { _tag: 'markdown_cell'; text: string }
  | { _tag: 'database_cell'; title: string; sql: UntrustedSqlFragment; row_limit: number }
  | {
      _tag: 'log_cell'
      title: string
      sql: UntrustedLogSqlFragment
      time_range: { _tag: 'relative_time_range'; unit: 'hour'; amount: number }
    }

export type AlertIssueNotebookDraft = {
  schema_version: 1
  cells: AlertIssueNotebookDraftCell[]
}

const escapeTableCell = (value: string) => value.replace(/\|/g, '\\|').replace(/\n/g, ' ')

const summaryMarkdown = (issue: AlertIssue, alertIssueUrl: string) => {
  const identifiers = Object.entries(issue.identifiers)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `| ${escapeTableCell(key)} | ${escapeTableCell(value)} |`)

  return [
    `# ${issue.title}`,
    issue.description ?? '',
    identifiers.length > 0
      ? ['| Identifier | Value |', '| --- | --- |', ...identifiers].join('\n')
      : '',
    `[View alert issue](${alertIssueUrl})`,
  ]
    .filter((part) => part.length > 0)
    .join('\n\n')
}

/**
 * The notebook created by "Open as notebook": a summary of the alert issue followed by its
 * runnable cells. Cells whose template could not be rendered are left out.
 */
export function buildAlertIssueNotebookContent(
  issue: AlertIssue,
  alertIssueUrl: string
): AlertIssueNotebookDraft {
  const queryCells = renderAlertIssueNotebook(issue).flatMap(
    (cell): AlertIssueNotebookDraftCell[] => {
      if (cell.status !== 'ready') return []
      if (cell.source === 'database') {
        return [{ _tag: 'database_cell', title: cell.title, sql: cell.sql, row_limit: 100 }]
      }
      return [
        {
          _tag: 'log_cell',
          title: cell.title,
          sql: cell.sql,
          time_range: { _tag: 'relative_time_range', unit: 'hour', amount: 24 },
        },
      ]
    }
  )

  return {
    schema_version: 1,
    cells: [{ _tag: 'markdown_cell', text: summaryMarkdown(issue, alertIssueUrl) }, ...queryCells],
  }
}
