import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import {
  ActivityIcon,
  BellIcon,
  BellOffIcon,
  ChevronsDownIcon,
  ChevronsUpIcon,
  CopyPlusIcon,
  Loader2Icon,
  RotateCcwIcon,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { IssueActorAvatar } from './IssueActorAvatar'
import { IssueCommentComposer } from './IssueCommentComposer'
import { IssueLink } from './IssueLink'
import { IssuePost } from './IssuePost'
import {
  DISMISS_REASON_LABELS,
  ISSUE_SEVERITIES,
  SEVERITY_LABELS,
  STATUS_ICONS,
  STATUS_TEXT_CLASSES,
} from './Issues.constants'
import {
  buildIssueTimeline,
  describeEpisodes,
  getActorDescription,
  getResourceLabel,
  type IssueTimelineItem,
} from './Issues.utils'
import { AlertError } from '@/components/ui/AlertError'
import type { Issue, IssueEvent } from '@/data/issues/issue-schema'
import { issueTimelineQueryOptions } from '@/data/issues/issue-timeline-query'

const ActivityLine = ({
  icon: Icon,
  iconClassName,
  timestamp,
  children,
}: {
  icon: LucideIcon
  iconClassName?: string
  timestamp: string
  children: ReactNode
}) => (
  <li className="relative mr-px flex items-center gap-3 pr-4 text-sm text-foreground-light">
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border bg-card">
      <Icon size={12} className={iconClassName ?? 'text-foreground-lighter'} aria-hidden />
    </span>
    <div className="min-w-0 flex-1">{children}</div>
    <TimestampInfo
      className="shrink-0 text-sm text-foreground-lighter"
      utcTimestamp={timestamp}
      label={dayjs(timestamp).fromNow()}
    />
  </li>
)

const getStatusChangeDescription = (event: Extract<IssueEvent, { type: 'status_changed' }>) => {
  const isAutomatic = event.actor.type === 'system'
  switch (event.to) {
    case 'open':
      return isAutomatic ? 'Reopened automatically' : ' reopened this'
    case 'resolved':
      return isAutomatic ? 'Resolved automatically after the check passed' : ' resolved this'
    case 'dismissed':
      return `${isAutomatic ? 'Dismissed' : ' dismissed this'}${event.dismiss_reason ? ` as ${DISMISS_REASON_LABELS[event.dismiss_reason].toLowerCase()}` : ''}`
    case 'snoozed':
      return `${isAutomatic ? 'Snoozed' : ' snoozed this'}${event.snoozed_until ? ` until ${dayjs(event.snoozed_until).format('MMM D')}` : ''}`
  }
}

const getResourceLabelById = (issue: Issue, affectedId: string) => {
  const affected = issue.affected.find((item) => item.id === affectedId)
  return affected ? getResourceLabel(affected) : 'an affected resource'
}

const getMuteDescription = (event: Extract<IssueEvent, { type: 'resource_muted' }>) =>
  [
    event.reason && ` as ${DISMISS_REASON_LABELS[event.reason].toLowerCase()}`,
    event.until && ` until ${dayjs(event.until).format('MMM D')}`,
  ]
    .filter(Boolean)
    .join('')

const EventItem = ({ issue, event }: { issue: Issue; event: IssueEvent }) => {
  const isAutomatic = event.actor.type === 'system'
  const actor = !isAutomatic && (
    <span className="text-foreground">{getActorDescription(event.actor)}</span>
  )
  switch (event.type) {
    case 'created':
      return null
    case 'status_changed': {
      // A check reopening a resolved issue is a regression. The timeline usually shows it on
      // the episode it reopened for; this covers one without an episode beside it.
      const isRegression = isAutomatic && event.from === 'resolved' && event.to === 'open'
      if (isRegression) {
        return (
          <ActivityLine
            icon={RotateCcwIcon}
            iconClassName="text-warning"
            timestamp={event.created_at}
          >
            Detected again after it was resolved
          </ActivityLine>
        )
      }
      return (
        <ActivityLine
          icon={STATUS_ICONS[event.to]}
          iconClassName={STATUS_TEXT_CLASSES[event.to]}
          timestamp={event.created_at}
        >
          {actor}
          {getStatusChangeDescription(event)}
        </ActivityLine>
      )
    }
    case 'severity_changed': {
      const isRaised = ISSUE_SEVERITIES.indexOf(event.to) < ISSUE_SEVERITIES.indexOf(event.from)
      return (
        <ActivityLine
          icon={isRaised ? ChevronsUpIcon : ChevronsDownIcon}
          timestamp={event.created_at}
        >
          {actor}
          {!isAutomatic && ' · '}
          Severity {isRaised ? 'raised' : 'lowered'} from {SEVERITY_LABELS[event.from]} to{' '}
          {SEVERITY_LABELS[event.to]}
        </ActivityLine>
      )
    }
    case 'resource_muted':
    case 'resource_unmuted': {
      const isMuted = event.type === 'resource_muted'
      return (
        <ActivityLine icon={isMuted ? BellOffIcon : BellIcon} timestamp={event.created_at}>
          {actor}
          {!isAutomatic && ' · '}
          {isMuted ? 'Muted' : 'Unmuted'}{' '}
          <span className="break-words">{getResourceLabelById(issue, event.affected_id)}</span>
          {event.type === 'resource_muted' && getMuteDescription(event)}
        </ActivityLine>
      )
    }
    case 'recurred':
      return (
        <ActivityLine icon={CopyPlusIcon} timestamp={event.created_at}>
          Detected again after the reopen window, so the check filed a new issue ·{' '}
          <IssueLink id={event.next_issue_id}>View new issue</IssueLink>
        </ActivityLine>
      )
    case 'comment':
      return (
        <li>
          <IssuePost
            id={event.id}
            actor={event.actor}
            createdAt={event.created_at}
            document={event.body}
          />
        </li>
      )
  }
}

/** A row in the timeline: an event, or what the check saw over one or more failing stretches. */
const TimelineItem = ({ issue, item }: { issue: Issue; item: IssueTimelineItem }) => {
  if (item.type === 'event') return <EventItem issue={issue} event={item.event} />

  const isOngoing = item.episodes.some((episode) => episode.ended_at === null)
  const isRegression = item.type === 'episodes' && item.isRegression
  return (
    <ActivityLine
      icon={isRegression ? RotateCcwIcon : ActivityIcon}
      iconClassName={isOngoing || isRegression ? 'text-warning' : undefined}
      timestamp={item.at}
    >
      <span className="break-words">
        {describeEpisodes({
          issue,
          episodes: item.episodes,
          isSummary: item.type === 'episode_summary',
          isRegression,
        })}
      </span>
    </ActivityLine>
  )
}

// A vertical line through the icon column joins the events
const TIMELINE_CLASSES =
  'relative before:absolute before:bottom-3 before:left-3 before:top-3 before:w-px before:bg-border'

const ActivitySection = ({ children }: { children: ReactNode }) => (
  <section aria-labelledby="issue-activity-heading" className="flex flex-col gap-4 border-t pt-8">
    <h2 id="issue-activity-heading" className="text-sm text-foreground">
      Activity
    </h2>
    {children}
  </section>
)

const SKELETON_LINE_WIDTHS = ['w-1/2', 'w-2/3', 'w-2/5']

/** Placeholder events shaped like ActivityLine: icon, one line of text, timestamp. */
const ActivitySkeletonLines = ({ className }: { className?: string }) => (
  <ol aria-hidden className={cn('flex flex-col gap-4', className)}>
    {SKELETON_LINE_WIDTHS.map((width, index) => (
      <li key={width} className="relative flex items-center gap-3 pr-4">
        <span className="size-6 shrink-0 rounded-full border bg-card" />
        <span className="flex h-5 flex-1 items-center">
          <ShimmeringLoader className={cn('h-3 py-0', width)} delayIndex={index} />
        </span>
        <ShimmeringLoader className="h-3 w-14 shrink-0 py-0" delayIndex={index} />
      </li>
    ))}
  </ol>
)

export const IssueActivitySkeleton = () => (
  <ActivitySection>
    <div className={TIMELINE_CLASSES}>
      <ActivitySkeletonLines />
    </div>
  </ActivitySection>
)

export const IssueActivity = ({ issue }: { issue: Issue }) => {
  const { ref } = useParams()
  const {
    data: timeline,
    error,
    isPending,
    isError,
    isSuccess,
  } = useQuery({
    ...issueTimelineQueryOptions({ projectRef: ref, id: issue.id }),
    // Keep fetching until the timeline has the completed reply as well as the issue, and
    // whatever the reply changed, such as the Assistant resolving it.
    refetchInterval: (query) => {
      const comments = query.state.data?.events.filter((event) => event.type === 'comment')
      const isBehindIssue = (comments?.length ?? 0) !== issue.comment_count
      return issue.agents_working.length > 0 || isBehindIssue ? 1500 : false
    },
  })

  return (
    <ActivitySection>
      {isError && <AlertError error={error} subject="Failed to retrieve issue activity" />}
      {/* The composer is the last stop on the timeline, so the line runs down to its avatar.
          Spacing sits below each item, so with no events the line starts behind the avatar. */}
      <div className={TIMELINE_CLASSES}>
        {isPending && <ActivitySkeletonLines className="mb-6" />}
        {isSuccess && (
          <ol className="mb-6 flex flex-col gap-4 empty:hidden">
            {buildIssueTimeline(timeline.events, timeline.episodes).map((item) => (
              <TimelineItem
                key={item.type === 'event' ? item.event.id : item.episodes[0].id}
                issue={issue}
                item={item}
              />
            ))}
          </ol>
        )}
        <div role="status" aria-live="polite">
          {issue.agents_working.map((actor) => (
            <div
              key={actor.id}
              className="mb-6 flex items-center gap-3 text-sm text-foreground-light"
            >
              <IssueActorAvatar actor={actor} />
              <span>{actor.name} is replying</span>
              <Loader2Icon size={14} className="animate-spin" aria-hidden />
            </div>
          ))}
        </div>
        <IssueCommentComposer issue={issue} />
      </div>
    </ActivitySection>
  )
}
