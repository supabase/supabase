import { Link } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { Loader2Icon } from 'lucide-react'
import { cn } from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import {
  SEVERITY_DOT_CLASSES,
  SEVERITY_LABELS,
} from '@/components/interfaces/Issues/Issues.constants'
import { formatIssueAge, getIssueSourceLabel } from '@/components/interfaces/Issues/Issues.utils'
import type { Issue, IssueSeverity } from '@/data/issues/issue-schema'

const rowClassName = (isActive: boolean) =>
  cn(
    'group relative flex w-full gap-2 rounded-md px-2 text-sm',
    isActive
      ? 'bg-selection text-foreground'
      : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
  )

const SeverityDot = ({ severity }: { severity: IssueSeverity }) => (
  <span
    className={cn('size-1.5 shrink-0 rounded-full', SEVERITY_DOT_CLASSES[severity])}
    role="img"
    aria-label={SEVERITY_LABELS[severity]}
  />
)

const IssueRowStatus = ({ issue }: { issue: Issue }) => {
  if (issue.agents_working.length > 0) {
    return (
      <span className="flex items-center" title="Assistant is replying">
        <Loader2Icon size={12} className="animate-spin text-brand" aria-hidden />
        <span className="sr-only">Assistant is replying</span>
      </span>
    )
  }
  return null
}

type IssueRowProps = {
  issue: Issue
  href: string
  isActive: boolean
}

export const IssuesListItem = ({ issue, href, isActive }: IssueRowProps) => {
  const sourceLabel = getIssueSourceLabel(issue)

  return (
    <Link
      to={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(rowClassName(isActive), 'flex-col gap-0.5 py-1.5')}
    >
      <span className="flex items-center gap-2">
        <SeverityDot severity={issue.severity} />
        <span className="flex-1 truncate">{issue.title}</span>
        <span className="shrink-0 text-sm text-foreground-lighter tabular-nums">
          <span aria-hidden>
            <TimestampInfo
              className="text-sm"
              utcTimestamp={issue.last_seen_at}
              label={formatIssueAge(issue.last_seen_at)}
            />
          </span>
          <span className="sr-only">Last seen {dayjs(issue.last_seen_at).fromNow()}</span>
        </span>
      </span>
      <span className="flex items-center gap-2 pl-3.5 text-sm text-foreground-lighter">
        <span className="flex-1 truncate">{sourceLabel}</span>
        <IssueRowStatus issue={issue} />
      </span>
    </Link>
  )
}
