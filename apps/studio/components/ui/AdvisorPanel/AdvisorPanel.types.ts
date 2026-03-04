import type { AdvisorIssue } from 'data/advisors/types'
import { Lint } from 'data/lint/lint-query'
import { Notification } from 'data/notifications/notifications-v2-query'
import { AdvisorItemSource, AdvisorSeverity } from 'state/advisor-state'

export type AdvisorItem = {
  id: string
  title: string
  severity: AdvisorSeverity
  createdAt?: number
  tab: 'security' | 'performance' | 'issues' | 'messages'
  source: AdvisorItemSource
  original: Lint | Notification | AdvisorIssue
}
