import {
  ActivityIcon,
  ArchiveIcon,
  BlocksIcon,
  BoxIcon,
  CheckCircle2Icon,
  CircleDotIcon,
  ClockIcon,
  CodeIcon,
  DatabaseZapIcon,
  EyeIcon,
  GaugeIcon,
  KeyRoundIcon,
  LayersIcon,
  ListOrderedIcon,
  ScanSearchIcon,
  ShieldCheckIcon,
  ShieldIcon,
  SquareFunctionIcon,
  Table2Icon,
  XCircleIcon,
  type LucideIcon,
} from 'lucide-react'

import type {
  IssueCategory,
  IssueDismissReason,
  IssueOriginType,
  IssueResource,
  IssueSeverity,
  IssueStatus,
} from '@/data/issues/issue-schema'

export const ISSUE_SEVERITIES: IssueSeverity[] = ['critical', 'warning', 'info']
export const ISSUE_CATEGORIES: IssueCategory[] = [
  'security',
  'performance',
  'health',
  'usage',
  'data',
]
export const ISSUE_ORIGIN_TYPES: IssueOriginType[] = ['check', 'manual']
// The categories built-in advisor checks belong to, in the order settings list them
export const ISSUE_CHECK_CATEGORIES = ['security', 'health', 'performance'] as const

export const SEVERITY_LABELS: Record<IssueSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

export const SEVERITY_TEXT_CLASSES: Record<IssueSeverity, string> = {
  critical: 'text-destructive',
  warning: 'text-warning',
  info: 'text-foreground-lighter',
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
  usage: 'Usage',
  data: 'Data quality',
}

export const CATEGORY_ICONS: Record<IssueCategory, LucideIcon> = {
  security: ShieldIcon,
  performance: GaugeIcon,
  health: ActivityIcon,
  usage: DatabaseZapIcon,
  data: ScanSearchIcon,
}

export const ORIGIN_LABELS: Record<IssueOriginType, string> = {
  check: 'Automated checks',
  manual: 'People and agents',
}

export const STATUS_LABELS: Record<IssueStatus, string> = {
  open: 'Open',
  snoozed: 'Snoozed',
  resolved: 'Resolved',
  dismissed: 'Dismissed',
}

export const STATUS_ICONS: Record<IssueStatus, LucideIcon> = {
  open: CircleDotIcon,
  snoozed: ClockIcon,
  resolved: CheckCircle2Icon,
  dismissed: XCircleIcon,
}

export const STATUS_TEXT_CLASSES: Record<IssueStatus, string> = {
  open: 'text-foreground-light',
  snoozed: 'text-foreground-lighter',
  resolved: 'text-brand',
  dismissed: 'text-foreground-lighter',
}

export const DISMISS_REASONS: IssueDismissReason[] = [
  'accepted_risk',
  'false_positive',
  'not_relevant',
]

export const DISMISS_REASON_LABELS: Record<IssueDismissReason, string> = {
  accepted_risk: 'Accepted risk',
  false_positive: 'False positive',
  not_relevant: 'Not relevant',
}

// What a count of affected resources calls each type, e.g. `3 tables`. Project-wide
// findings, like an error rate on the Data API, and findings without a resource count as
// resources.
export const RESOURCE_TYPE_NOUNS: Record<
  IssueResource['type'] | 'other',
  { one: string; other: string }
> = {
  table: { one: 'table', other: 'tables' },
  view: { one: 'view', other: 'views' },
  materialized_view: { one: 'materialized view', other: 'materialized views' },
  foreign_table: { one: 'foreign table', other: 'foreign tables' },
  function: { one: 'function', other: 'functions' },
  extension: { one: 'extension', other: 'extensions' },
  index: { one: 'index', other: 'indexes' },
  policy: { one: 'policy', other: 'policies' },
  auth: { one: 'Auth setting', other: 'Auth settings' },
  storage_bucket: { one: 'bucket', other: 'buckets' },
  edge_function: { one: 'Edge Function', other: 'Edge Functions' },
  project: { one: 'resource', other: 'resources' },
  other: { one: 'resource', other: 'resources' },
}

export const RESOURCE_TYPE_ICONS: Record<IssueResource['type'] | 'other', LucideIcon> = {
  table: Table2Icon,
  view: EyeIcon,
  materialized_view: LayersIcon,
  foreign_table: Table2Icon,
  function: SquareFunctionIcon,
  extension: BlocksIcon,
  index: ListOrderedIcon,
  policy: ShieldCheckIcon,
  auth: KeyRoundIcon,
  storage_bucket: ArchiveIcon,
  edge_function: CodeIcon,
  project: BoxIcon,
  other: BoxIcon,
}

export const SNOOZE_OPTIONS = [
  { label: '1 day', days: 1 },
  { label: '1 week', days: 7 },
  { label: '1 month', days: 30 },
]
