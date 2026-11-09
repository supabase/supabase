import type { Lint } from '@/data/lint/lint-query'

export type IssueSeverity = 'critical' | 'warning' | 'info'
export type IssueCategory = 'security' | 'performance' | 'health'

export type IssueResourceType =
  | 'bucket'
  | 'table'
  | 'view'
  | 'materialized_view'
  | 'foreign_table'
  | 'function'
  | 'extension'
  | 'auth'
  | 'ip_address'
  | 'project'

export type IssueResource = {
  type: IssueResourceType
  name: string
  schema: string | null
}

export type IssueLinkAction = { label: string; href: string }

/**
 * One place the problem shows up. A check failing on three tables is one issue with three
 * affected resources.
 */
export type IssueAffectedResource = {
  id: string
  resource: IssueResource
  detail: string | null
  severity: IssueSeverity
  /** The finding this came from, which knows how to fix it. Null for non-lint findings. */
  lint: Lint | null
  /** Where to go to fix it, when the finding isn't a lint */
  action: IssueLinkAction | null
}

/**
 * Something wrong with the project right now, derived on read from the checks that found
 * it. A check that stops failing no longer returns an issue, so there's no stored status.
 */
export type Issue = {
  /** The check's name, e.g. `rls_disabled_in_public`, so a link keeps working between runs */
  id: string
  title: string
  /** Markdown */
  description: string
  severity: IssueSeverity
  category: IssueCategory
  source: 'lint' | 'signal'
  docsUrl: string
  affected: IssueAffectedResource[]
}
