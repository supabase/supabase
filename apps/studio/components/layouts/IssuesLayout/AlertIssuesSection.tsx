import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import Link from 'next/link'
import { cn } from 'ui'

import {
  ALERT_ISSUE_STATUS_LABELS,
  sortActiveAlertIssues,
} from '@/components/interfaces/Issues/AlertIssues.utils'
import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'
import { alertIssuesQueryOptions } from '@/data/alert-issues/alert-issues-query'
import { useAlertIssuesReadMutation } from '@/data/alert-issues/alert-issues-read-mutation'
import { IS_PLATFORM } from '@/lib/constants'

const AlertIssuesListItem = ({
  issue,
  href,
  isActive,
  onOpen,
}: {
  issue: AlertIssue
  href: string
  isActive: boolean
  onOpen: () => void
}) => (
  <Link
    href={href}
    onClick={onOpen}
    aria-current={isActive ? 'page' : undefined}
    className={cn(
      'group relative flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-sm',
      isActive
        ? 'bg-selection text-foreground'
        : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
    )}
  >
    <span className="flex items-center gap-2">
      <span
        role="img"
        aria-label={issue.unread ? 'Unread' : 'Read'}
        className={cn(
          'size-1.5 shrink-0 rounded-full',
          issue.unread ? 'bg-brand' : 'bg-transparent'
        )}
      />
      <span className={cn('flex-1 truncate', issue.unread && 'text-foreground')}>
        {issue.title}
      </span>
    </span>
    <span className="truncate pl-3.5 text-sm text-foreground-lighter">
      {`${ALERT_ISSUE_STATUS_LABELS[issue.status]} · ${dayjs(issue.last_seen_at).fromNow()}`}
    </span>
  </Link>
)

export const AlertIssuesSection = () => {
  const { ref, alertIssueId } = useParams()
  const { data, isSuccess } = useQuery(alertIssuesQueryOptions({ projectRef: ref }))
  const { mutate: markRead } = useAlertIssuesReadMutation({ onError: () => {} })

  if (IS_PLATFORM || !isSuccess || !ref) return null

  const issues = sortActiveAlertIssues(data)
  if (issues.length === 0) return null

  return (
    <div className="flex flex-col gap-px pb-2">
      <p className="px-2 pb-1 text-xs text-foreground-lighter">From alerts</p>
      {issues.map((issue) => (
        <AlertIssuesListItem
          key={issue.alert_issue_id}
          issue={issue}
          href={`/project/${ref}/issues/alerts/${issue.alert_issue_id}`}
          isActive={issue.alert_issue_id === alertIssueId}
          onOpen={() => {
            if (issue.unread) {
              markRead({ projectRef: ref, alertIssueIds: [issue.alert_issue_id], read: true })
            }
          }}
        />
      ))}
    </div>
  )
}
