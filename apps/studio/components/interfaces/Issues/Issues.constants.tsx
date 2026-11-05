import { ActivityIcon, GaugeIcon, ShieldIcon, type LucideIcon } from 'lucide-react'

import type { IssueCategory, IssueResourceType, IssueSeverity } from '@/data/issues/issue.types'

export const ISSUE_SEVERITIES: IssueSeverity[] = ['critical', 'warning', 'info']
export const ISSUE_CATEGORIES: IssueCategory[] = ['security', 'performance', 'health']

export const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

export const SEVERITY_DOT_CLASSES: Record<IssueSeverity, string> = {
  critical: 'bg-destructive',
  warning: 'bg-warning',
  info: 'bg-foreground-muted',
}

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  security: 'Security',
  performance: 'Performance',
  health: 'Health',
}

export const CATEGORY_ICONS: Record<IssueCategory, LucideIcon> = {
  security: ShieldIcon,
  performance: GaugeIcon,
  health: ActivityIcon,
}

// What a count of affected resources calls each type, e.g. `3 tables`
export const RESOURCE_TYPE_NOUNS: Record<IssueResourceType, { one: string; other: string }> = {
  table: { one: 'table', other: 'tables' },
  view: { one: 'view', other: 'views' },
  materialized_view: { one: 'materialized view', other: 'materialized views' },
  foreign_table: { one: 'foreign table', other: 'foreign tables' },
  function: { one: 'function', other: 'functions' },
  extension: { one: 'extension', other: 'extensions' },
  auth: { one: 'Auth setting', other: 'Auth settings' },
  ip_address: { one: 'IP address', other: 'IP addresses' },
  project: { one: 'resource', other: 'resources' },
}
