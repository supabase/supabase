import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { IssueActorAvatar } from './IssueActorAvatar'
import { IssueAffectedResources } from './IssueAffectedResources'
import { IssueLink } from './IssueLink'
import { CATEGORY_ICONS, CATEGORY_LABELS } from './Issues.constants'
import { getActorDescription } from './Issues.utils'
import { IssueStatusMenu } from './IssueStatusMenu'
import type { Issue } from '@/data/issues/issue-schema'

// Stacked label over value in a narrow side column, label beside value once there's width.
// A value of several lines aligns its label with the first one.
const IssueProperty = ({
  label,
  align = 'center',
  children,
}: {
  label: string
  align?: 'center' | 'start'
  children: ReactNode
}) => (
  <div
    className={cn(
      'flex min-w-0 flex-col gap-1.5 @3xs:grid @3xs:grid-cols-[6rem_minmax(0,1fr)] @3xs:gap-x-4',
      align === 'center' ? '@3xs:items-center' : '@3xs:items-start'
    )}
  >
    <dt className={cn('heading-meta text-foreground-lighter', align === 'start' && '@3xs:pt-1')}>
      {label}
    </dt>
    <dd className="flex min-w-0 items-center gap-2 text-sm text-foreground">{children}</dd>
  </div>
)

const IssueTimestamp = ({ timestamp }: { timestamp: string }) => (
  <TimestampInfo className="text-sm" utcTimestamp={timestamp} label={dayjs(timestamp).fromNow()} />
)

const IssuePropertiesList = ({ children }: { children: ReactNode }) => (
  <div className="@container">
    <dl className="flex flex-col gap-6 @3xs:gap-3">{children}</dl>
  </div>
)

// Status is a 28px button; every other value is a single line of text
const SKELETON_ROWS = [
  { label: 'Status', width: 'w-16', height: 'h-7' },
  { label: 'Category', width: 'w-20', height: 'h-5' },
  { label: 'Reported by', width: 'w-28', height: 'h-5' },
  { label: 'First seen', width: 'w-20', height: 'h-5' },
]

export const IssuePropertiesSkeleton = () => (
  <IssuePropertiesList>
    {SKELETON_ROWS.map(({ label, width, height }, index) => (
      <IssueProperty key={label} label={label}>
        <span className={cn('flex w-full items-center', height)}>
          <ShimmeringLoader className={cn('h-3 py-0', width)} delayIndex={index} />
        </span>
      </IssueProperty>
    ))}
  </IssuePropertiesList>
)

/** Status, category, who reported it and when, as label and value pairs. */
export const IssueProperties = ({ issue }: { issue: Issue }) => {
  const CategoryIcon = CATEGORY_ICONS[issue.category]
  const hasAffected = issue.origin.type === 'check' || issue.affected.length > 0

  return (
    <IssuePropertiesList>
      <IssueProperty label="Status">
        <IssueStatusMenu issue={issue} />
      </IssueProperty>
      <IssueProperty label="Category">
        <CategoryIcon size={14} className="shrink-0 text-foreground-lighter" aria-hidden />
        {CATEGORY_LABELS[issue.category]}
      </IssueProperty>
      <IssueProperty label="Reported by">
        <IssueActorAvatar actor={issue.created_by} size="sm" />
        <span className="truncate">{getActorDescription(issue.created_by)}</span>
      </IssueProperty>
      {hasAffected && (
        <IssueProperty label="Affected" align="start">
          <IssueAffectedResources key={issue.id} issue={issue} />
        </IssueProperty>
      )}
      <IssueProperty label="First seen">
        <IssueTimestamp timestamp={issue.first_seen_at} />
      </IssueProperty>
      {issue.previous_issue_id && (
        <IssueProperty label="Previously">
          <IssueLink id={issue.previous_issue_id} />
        </IssueProperty>
      )}
    </IssuePropertiesList>
  )
}
