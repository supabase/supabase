import LintDetail from 'components/interfaces/Linter/LintDetail'
import type { AdvisorIssue, IssueStatus } from 'data/advisors/types'
import { Lint } from 'data/lint/lint-query'
import { Notification } from 'data/notifications/notifications-v2-query'
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import { noop } from 'lodash'
import { Badge, Button } from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import type { AdvisorItem } from './AdvisorPanel.types'
import { NotificationDetail } from './NotificationDetail'
import { severityBadgeVariants } from './AdvisorPanel.utils'

interface AdvisorDetailProps {
  item: AdvisorItem
  projectRef: string
  onUpdateNotificationStatus?: (id: string, status: 'archived' | 'seen') => void
  onUpdateIssueStatus?: (issueId: string, status: IssueStatus) => void
}

const IssueDetail = ({
  issue,
  projectRef,
  onUpdateStatus,
}: {
  issue: AdvisorIssue
  projectRef: string
  onUpdateStatus?: (issueId: string, status: IssueStatus) => void
}) => {
  const isActive = ['open', 'acknowledged', 'snoozed'].includes(issue.status)
  const SeverityIcon =
    issue.severity === 'critical'
      ? AlertOctagon
      : issue.severity === 'warning'
        ? AlertTriangle
        : Info

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <SeverityIcon className="h-5 w-5 shrink-0 mt-0.5 text-foreground-lighter" />
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-foreground">{issue.title}</h3>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            <Badge variant={severityBadgeVariants[issue.severity]}>{issue.severity}</Badge>
            <Badge variant="default">{issue.category}</Badge>
            <span className="text-xs text-foreground-lighter capitalize">{issue.status}</span>
          </div>
        </div>
      </div>

      {issue.description && (
        <p className="text-sm text-foreground-lighter whitespace-pre-wrap">{issue.description}</p>
      )}

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-foreground-lighter">Alerts</span>
          <span className="text-foreground font-medium">
            {issue.alert_count}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-foreground-lighter">First seen</span>
          <TimestampInfo
            utcTimestamp={issue.first_triggered_at}
            labelFormat="D MMM YYYY"
            className="text-sm"
          />
        </div>
        <div className="flex justify-between">
          <span className="text-foreground-lighter">Last seen</span>
          <TimestampInfo
            utcTimestamp={issue.last_triggered_at}
            labelFormat="D MMM YYYY"
            className="text-sm"
          />
        </div>
      </div>

      {onUpdateStatus && isActive && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {issue.status !== 'acknowledged' && (
            <Button
              type="outline"
              size="tiny"
              icon={<Eye className="h-3 w-3" />}
              onClick={() => onUpdateStatus(issue.id, 'acknowledged')}
            >
              Acknowledge
            </Button>
          )}
          <Button
            type="outline"
            size="tiny"
            icon={<Clock className="h-3 w-3" />}
            onClick={() => onUpdateStatus(issue.id, 'snoozed')}
          >
            Snooze
          </Button>
          <Button
            type="default"
            size="tiny"
            icon={<CheckCircle2 className="h-3 w-3" />}
            onClick={() => onUpdateStatus(issue.id, 'resolved')}
          >
            Resolve
          </Button>
          <Button
            type="text"
            size="tiny"
            icon={<EyeOff className="h-3 w-3" />}
            onClick={() => onUpdateStatus(issue.id, 'dismissed')}
          >
            Dismiss
          </Button>
        </div>
      )}

      <Button type="default" size="small" icon={<ExternalLink className="h-3 w-3" />} asChild>
        <Link href={`/project/${projectRef}/advisors/issues/${issue.id}`}>View full details</Link>
      </Button>
    </div>
  )
}

export const AdvisorDetail = ({
  item,
  projectRef,
  onUpdateNotificationStatus = noop,
  onUpdateIssueStatus,
}: AdvisorDetailProps) => {
  if (item.source === 'lint') {
    const lint = item.original as Lint
    return (
      <div className="px-6 py-6">
        <LintDetail lint={lint} projectRef={projectRef} />
      </div>
    )
  }

  if (item.source === 'notification') {
    const notification = item.original as Notification
    return (
      <div className="px-6 py-6">
        <NotificationDetail
          notification={notification}
          onUpdateStatus={onUpdateNotificationStatus}
        />
      </div>
    )
  }

  if (item.source === 'issue') {
    const issue = item.original as AdvisorIssue
    return (
      <div className="px-6 py-6">
        <IssueDetail
          issue={issue}
          projectRef={projectRef}
          onUpdateStatus={onUpdateIssueStatus}
        />
      </div>
    )
  }

  return null
}
