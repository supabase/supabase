import type { Lint } from '@/data/lint/lint-query'
import type { Notification } from '@/data/notifications/notifications-v2-query'
import type { AccountRecoveryFinding } from '@/lib/account-recovery/evaluate-account-recovery'
import type { AdvisorCategory, AdvisorItemSource, AdvisorSeverity } from '@/state/advisor-state'

export type AdvisorSignalType = 'banned-ip' | AccountRecoveryFinding['id']

export type AdvisorSignalAction = {
  label: string
  href: string
}

type AdvisorBaseItem = {
  id: string
  title: string
  severity: AdvisorSeverity
  createdAt?: number
  category: AdvisorCategory
  source: AdvisorItemSource
}

export type AdvisorLintItem = AdvisorBaseItem & {
  source: 'lint'
  original: Lint
}

export type AdvisorNotificationItem = AdvisorBaseItem & {
  source: 'notification'
  original: Notification
  project_ref?: string
}

type AdvisorBaseSignalItem = AdvisorBaseItem & {
  source: 'signal'
  summary: string
  actions: AdvisorSignalAction[]
}

export type AdvisorBannedIPSignalItem = AdvisorBaseSignalItem & {
  scope: 'project'
  type: 'banned-ip'
  dismissalKey: string
  description?: string
  docsUrl?: string
  sourceData: { type: 'banned-ip'; ip: string }
}

export type AdvisorAccountItem = AdvisorBaseSignalItem & {
  scope: 'account'
  type: AccountRecoveryFinding['id']
}

export type AdvisorSignalItem = AdvisorBannedIPSignalItem | AdvisorAccountItem

export type AdvisorItem = AdvisorLintItem | AdvisorNotificationItem | AdvisorSignalItem
