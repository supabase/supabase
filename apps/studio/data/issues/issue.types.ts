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

export type IssueAffectedResource = {
  id: string
  resource: IssueResource
  detail: string | null
  severity: IssueSeverity
  lint: Lint | null
  action: IssueLinkAction | null
}

export type Issue = {
  id: string
  title: string
  description: string
  severity: IssueSeverity
  category: IssueCategory
  source: 'lint' | 'signal'
  docsUrl: string
  affected: IssueAffectedResource[]
}
