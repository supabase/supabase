import { useParams } from 'common'
import { useAdvisorIssueDetailQuery, useUpdateIssueMutation } from 'data/advisors/issues-query'
import type { AdvisorAlert, AdvisorSeverity, IssueStatus } from 'data/advisors/types'
import {
  AlertOctagon,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Badge, Button, Card, CardContent } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'
import { IssueActions } from './IssueActions'

const severityConfig: Record<
  AdvisorSeverity,
  { icon: typeof AlertOctagon; color: string; bg: string; badgeVariant: 'destructive' | 'warning' | 'default' }
> = {
  critical: { icon: AlertOctagon, color: 'text-destructive-600', bg: 'bg-destructive-200', badgeVariant: 'destructive' },
  warning: { icon: AlertTriangle, color: 'text-warning-600', bg: 'bg-warning-200', badgeVariant: 'warning' },
  info: { icon: Info, color: 'text-foreground-lighter', bg: 'bg-surface-200', badgeVariant: 'default' },
}

function AlertTimelineItem({ alert }: { alert: AdvisorAlert }) {
  const sev = severityConfig[alert.severity] ?? severityConfig.info
  const SeverityIcon = sev.icon

  return (
    <div className="flex gap-3 py-3">
      <div className={`mt-0.5 rounded-full p-1 ${sev.bg}`}>
        <SeverityIcon className={`h-3 w-3 ${sev.color}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{alert.title}</p>
        {alert.description && (
          <p className="mt-1 text-xs text-foreground-lighter whitespace-pre-wrap line-clamp-3">
            {alert.description}
          </p>
        )}
        <TimestampInfo
          className="text-xs mt-1"
          utcTimestamp={alert.triggered_at}
          labelFormat="D MMM, YYYY HH:mm"
        />
      </div>
    </div>
  )
}

export function IssueDetail() {
  const { ref: projectRef, id: issueId } = useParams()
  const { data: issue, isLoading } = useAdvisorIssueDetailQuery(projectRef, issueId)
  const updateMutation = useUpdateIssueMutation(projectRef)

  const handleStatusChange = (status: IssueStatus) => {
    if (!issueId) return
    updateMutation.mutate(
      { issueId, status },
      { onSuccess: () => toast.success(`Issue ${status}`) }
    )
  }

  if (isLoading) return <GenericSkeletonLoader />

  if (!issue) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-foreground-lighter">
        Issue not found
      </div>
    )
  }

  const sev = severityConfig[issue.severity] ?? severityConfig.info
  const SeverityIcon = sev.icon
  const isActive = ['open', 'acknowledged', 'snoozed'].includes(issue.status)

  return (
    <div className="mx-auto w-full max-w-7xl flex flex-col gap-y-6 px-5 py-6">
      <Link
        href={`/project/${projectRef}/advisors/issues`}
        className="inline-flex items-center gap-1 text-xs text-foreground-lighter hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-3 w-3" />
        Back to Issues
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <SeverityIcon className={`mt-0.5 h-5 w-5 shrink-0 ${sev.color}`} />
          <div>
            <h1 className="text-lg font-semibold text-foreground">{issue.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-foreground-lighter">
              <Badge variant={sev.badgeVariant}>{issue.severity}</Badge>
              <Badge variant="default">{issue.category}</Badge>
              <span className="capitalize">{issue.status}</span>
              <span>&middot;</span>
              <span>{issue.alert_count} alert{issue.alert_count !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 shrink-0">
          {isActive && issue.status !== 'acknowledged' && (
            <Button type="outline" size="tiny" icon={<Eye className="h-3 w-3" />} onClick={() => handleStatusChange('acknowledged')}>
              Acknowledge
            </Button>
          )}
          {isActive && (
            <Button type="outline" size="tiny" icon={<Clock className="h-3 w-3" />} onClick={() => handleStatusChange('snoozed')}>
              Snooze
            </Button>
          )}
          {isActive && (
            <Button type="default" size="tiny" icon={<CheckCircle2 className="h-3 w-3" />} onClick={() => handleStatusChange('resolved')}>
              Resolve
            </Button>
          )}
          {!isActive && issue.status === 'resolved' && (
            <Button type="outline" size="tiny" icon={<AlertTriangle className="h-3 w-3" />} onClick={() => handleStatusChange('open')}>
              Reopen
            </Button>
          )}
          {isActive && (
            <Button type="text" size="tiny" icon={<EyeOff className="h-3 w-3" />} onClick={() => handleStatusChange('dismissed')}>
              Dismiss
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="px-6 py-3 border-b border-default">
                <h3 className="text-sm font-medium text-foreground">Alert Timeline</h3>
              </div>
              <div className="px-6">
                {issue.alerts && issue.alerts.length > 0 ? (
                  <div className="divide-y divide-default">
                    {issue.alerts.map((alert) => (
                      <AlertTimelineItem key={alert.id} alert={alert} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground-lighter py-6">No alerts recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <IssueActions issue={issue} />

          {issue.description && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-medium text-foreground mb-2">Description</h3>
                <p className="text-sm text-foreground-lighter whitespace-pre-wrap">
                  {issue.description}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-medium text-foreground mb-3">Details</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-foreground-lighter">Status</dt>
                  <dd className="text-foreground font-medium capitalize">{issue.status}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground-lighter">Category</dt>
                  <dd className="text-foreground font-medium capitalize">{issue.category}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground-lighter">Alerts</dt>
                  <dd className="text-foreground font-medium">{issue.alert_count}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground-lighter">First seen</dt>
                  <dd className="text-foreground font-medium">
                    <TimestampInfo utcTimestamp={issue.first_triggered_at} labelFormat="D MMM YYYY" className="text-sm" />
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-foreground-lighter">Last seen</dt>
                  <dd className="text-foreground font-medium">
                    <TimestampInfo utcTimestamp={issue.last_triggered_at} labelFormat="D MMM YYYY" className="text-sm" />
                  </dd>
                </div>
                {issue.resolved_at && (
                  <div className="flex justify-between">
                    <dt className="text-foreground-lighter">Resolved</dt>
                    <dd className="text-foreground font-medium">
                      <TimestampInfo utcTimestamp={issue.resolved_at} labelFormat="D MMM YYYY" className="text-sm" />
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
