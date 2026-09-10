import dayjs from 'dayjs'
import { Activity, Gauge, Inbox, Shield } from 'lucide-react'
import type { ElementType } from 'react'

import type { AdvisorItem, AdvisorLintItem, AdvisorNotificationItem } from './AdvisorPanel.types'
import { lintInfoMap } from '@/components/interfaces/Linter/Linter.utils'
import type { Lint } from '@/data/lint/lint-query'
import type { Notification, NotificationData } from '@/data/notifications/notifications-v2-query'
import type { AdvisorCategory, AdvisorSeverity } from '@/state/advisor-state'

export const MAX_HOMEPAGE_ADVISOR_ITEMS = 4

export const severityOrder: Record<AdvisorSeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
}

export const lintLevelToSeverity = (level: Lint['level']): AdvisorSeverity => {
  switch (level) {
    case 'ERROR':
      return 'critical'
    case 'WARN':
      return 'warning'
    default:
      return 'info'
  }
}

export const notificationPriorityToSeverity = (
  priority: string | null | undefined
): AdvisorSeverity => {
  switch (priority) {
    case 'Critical':
      return 'critical'
    case 'Warning':
      return 'warning'
    default:
      return 'info'
  }
}

export type LintCategory = Lint['categories'][number]

/**
 * A lint can carry more than one category, so the order here decides which one it is
 * filtered and reported under.
 */
const lintCategoryPriority = ['SECURITY', 'PERFORMANCE', 'HEALTH'] as const

const lintToAdvisorCategory = {
  SECURITY: 'security',
  PERFORMANCE: 'performance',
  HEALTH: 'health',
} as const satisfies Record<LintCategory, AdvisorCategory>

export const getLintCategory = (lint: Lint): LintCategory | undefined =>
  lintCategoryPriority.find((category) => (lint.categories || []).includes(category))

/**
 * Telemetry reports the API's own category names. Notifications have no API category;
 * signals are security-only today.
 */
export const getAdvisorItemTelemetryCategory = (item: AdvisorItem): LintCategory | undefined => {
  if (item.source === 'lint') return getLintCategory(item.original)
  if (item.source === 'signal') return 'SECURITY'
  return undefined
}

export const createAdvisorLintItems = (lintData?: Lint[]): AdvisorLintItem[] => {
  if (!lintData) return []

  return lintData
    .map((lint): AdvisorLintItem | null => {
      const category = getLintCategory(lint)

      if (!category) return null

      return {
        category: lintToAdvisorCategory[category],
        id: lint.cache_key,
        title: lint.detail,
        severity: lintLevelToSeverity(lint.level),
        createdAt: undefined,
        source: 'lint',
        original: lint,
      }
    })
    .filter((item): item is AdvisorLintItem => item !== null)
}

export const createAdvisorNotificationItems = (
  notifications?: Notification[]
): AdvisorNotificationItem[] => {
  if (!notifications) return []

  return notifications.map((notification) => {
    const data = notification.data as NotificationData

    return {
      id: notification.id,
      title: data.title,
      severity: notificationPriorityToSeverity(notification.priority),
      createdAt: dayjs(notification.inserted_at).valueOf(),
      category: 'messages' as const,
      source: 'notification' as const,
      original: notification,
      project_ref: data.project_ref,
    }
  })
}

export const sortAdvisorItems = <T extends AdvisorItem>(items: T[]) => {
  return [...items].sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity]
    if (severityDiff !== 0) return severityDiff

    const createdDiff = (b.createdAt ?? 0) - (a.createdAt ?? 0)
    if (createdDiff !== 0) return createdDiff

    return getAdvisorItemDisplayTitle(a).localeCompare(getAdvisorItemDisplayTitle(b))
  })
}

export const formatItemDate = (timestamp: number): string => {
  const daysFromNow = dayjs().diff(dayjs(timestamp), 'day')
  const formattedTimeFromNow = dayjs(timestamp).fromNow()
  const formattedInsertedAt = dayjs(timestamp).format('MMM DD, YYYY')
  return daysFromNow > 1 ? formattedInsertedAt : formattedTimeFromNow
}

export const getAdvisorItemDisplayTitle = (item: AdvisorItem): string => {
  if (item.source === 'lint') {
    return (
      lintInfoMap.find((info) => info.name === item.original.name)?.title ||
      item.title.replace(/[`\\]/g, '')
    )
  }

  if (item.source === 'signal') {
    return `${item.title}`
  }

  return item.title.replace(/[`\\]/g, '')
}

export const getAdvisorPanelItemDisplayTitle = (item: AdvisorItem): string => {
  if (item.source === 'signal') {
    return item.title
  }

  return getAdvisorItemDisplayTitle(item)
}

export const getAdvisorItemSecondaryText = (
  item: AdvisorItem,
  projectNameByRef?: ReadonlyMap<string, string>
): string | undefined => {
  if (item.source === 'lint') {
    return getLintEntityString(item.original)
  }

  if (item.source === 'signal') {
    return `Database · ${item.sourceData.ip}`
  }

  if (item.source === 'notification') {
    if (!item.project_ref) return undefined
    return projectNameByRef?.get(item.project_ref) ?? item.project_ref
  }

  return undefined
}

export const advisorCategoryIcons: Record<AdvisorCategory, ElementType> = {
  security: Shield,
  performance: Gauge,
  health: Activity,
  messages: Inbox,
}

export const advisorCategoryLabels: Record<AdvisorCategory, string> = {
  security: 'Security',
  performance: 'Performance',
  health: 'Health',
  messages: 'Messages',
}

export const severityColorClasses: Record<AdvisorSeverity, string> = {
  critical: 'text-destructive',
  warning: 'text-warning',
  info: 'text-foreground-light',
}

export const severityBadgeVariants: Record<AdvisorSeverity, 'destructive' | 'warning' | 'default'> =
  {
    critical: 'destructive',
    warning: 'warning',
    info: 'default',
  }

export const severityLabels: Record<AdvisorSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

export const getLintEntityString = (lint: Lint | null): string | undefined => {
  if (!lint?.metadata) {
    return undefined
  }

  if (lint.metadata.entity) {
    return lint.metadata.entity
  }

  if (lint.metadata.schema && lint.metadata.name) {
    const extendedMetadata = lint.metadata as typeof lint.metadata & { arguments?: string }
    const args =
      typeof extendedMetadata.arguments === 'string' ? extendedMetadata.arguments : undefined
    return `${lint.metadata.schema}.${lint.metadata.name}${args !== undefined ? `(${args})` : ''}`
  }

  return undefined
}
