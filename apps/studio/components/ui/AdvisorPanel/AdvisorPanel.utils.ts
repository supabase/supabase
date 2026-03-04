import dayjs from 'dayjs'
import { AlertCircle, Gauge, Inbox, Shield } from 'lucide-react'

import { lintInfoMap } from 'components/interfaces/Linter/Linter.utils'
import type { AdvisorIssue } from 'data/advisors/types'
import { Lint } from 'data/lint/lint-query'
import { AdvisorSeverity, AdvisorTab } from 'state/advisor-state'
import type { AdvisorItem } from './AdvisorPanel.types'

export const formatItemDate = (timestamp: number): string => {
  const daysFromNow = dayjs().diff(dayjs(timestamp), 'day')
  const formattedTimeFromNow = dayjs(timestamp).fromNow()
  const formattedInsertedAt = dayjs(timestamp).format('MMM DD, YYYY')
  return daysFromNow > 1 ? formattedInsertedAt : formattedTimeFromNow
}

export const getAdvisorItemDisplayTitle = (item: AdvisorItem): string => {
  if (item.source === 'lint') {
    const lint = item.original as Lint
    return (
      lintInfoMap.find((info) => info.name === lint.name)?.title || item.title.replace(/[`\\]/g, '')
    )
  }
  if (item.source === 'issue') {
    return item.title
  }
  return item.title.replace(/[`\\]/g, '')
}

export const getIssueEntityString = (issue: AdvisorIssue | null): string | undefined => {
  if (!issue) return undefined
  const parts: string[] = []
  if (issue.category) parts.push(issue.category)
  if (issue.alert_count > 0) parts.push(`${issue.alert_count} alert${issue.alert_count !== 1 ? 's' : ''}`)
  return parts.length > 0 ? parts.join(' · ') : undefined
}

export const tabIconMap: Record<Exclude<AdvisorTab, 'all'>, React.ElementType> = {
  security: Shield,
  performance: Gauge,
  issues: AlertCircle,
  messages: Inbox,
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
    return `${lint.metadata.schema}.${lint.metadata.name}`
  }

  return undefined
}
