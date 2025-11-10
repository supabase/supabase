import dayjs from 'dayjs'
import { Gauge, Inbox, Shield } from 'lucide-react'

import { lintInfoMap } from 'components/interfaces/Linter/Linter.utils'
import { Lint } from 'data/lint/lint-query'
import { AdvisorSeverity, AdvisorTab } from 'state/advisor-state'
import type { AdvisorItem } from './AdvisorPanel.types'

export const formatItemDate = (timestamp: number): string => {
  const insertedAt = timestamp
  const daysFromNow = dayjs().diff(dayjs(insertedAt), 'day')
  const formattedTimeFromNow = dayjs(insertedAt).fromNow()
  const formattedInsertedAt = dayjs(insertedAt).format('MMM DD, YYYY')
  return daysFromNow > 1 ? formattedInsertedAt : formattedTimeFromNow
}

export const getAdvisorItemDisplayTitle = (item: AdvisorItem): string => {
  if (item.source === 'lint') {
    const lint = item.original as Lint
    return (
      lintInfoMap.find((info) => info.name === lint.name)?.title || item.title.replace(/[`\\]/g, '')
    )
  }
  return item.title.replace(/[`\\]/g, '')
}

export const tabIconMap: Record<Exclude<AdvisorTab, 'all'>, React.ElementType> = {
  security: Shield,
  performance: Gauge,
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
