import Link from 'next/link'
import { cn } from 'ui'

import { CATEGORY_LABELS } from '@/components/interfaces/Issues/Issues.constants'
import {
  getIssueTelemetryProperties,
  summarizeAffected,
} from '@/components/interfaces/Issues/Issues.utils'
import { SeverityIndicator } from '@/components/interfaces/Issues/SeverityIndicator'
import type { Issue } from '@/data/issues/issue.types'
import { useTrack } from '@/lib/telemetry/track'

type IssueRowProps = {
  issue: Issue
  href: string
  isActive: boolean
}

export const IssuesListItem = ({ issue, href, isActive }: IssueRowProps) => {
  const track = useTrack()
  const affectedSummary = summarizeAffected(issue.affected)

  const handleClick = () => {
    track('advisor_detail_opened', {
      origin: 'advisors_page',
      advisorSource: issue.source,
      ...getIssueTelemetryProperties(issue),
    })
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'group relative flex w-full flex-col gap-0.5 rounded-md px-2 py-1.5 text-sm',
        isActive
          ? 'bg-selection text-foreground'
          : 'text-foreground-light hover:bg-surface-200 hover:text-foreground'
      )}
    >
      <span className="flex items-center gap-2">
        <SeverityIndicator severity={issue.severity} />
        <span className="flex-1 truncate">{issue.title}</span>
      </span>
      <span className="truncate pl-5 text-sm text-foreground-lighter">
        {CATEGORY_LABELS[issue.category]}
        {affectedSummary && <span> · {affectedSummary}</span>}
      </span>
    </Link>
  )
}
