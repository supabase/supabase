import dayjs from 'dayjs'

import {
  CATEGORY_LABELS,
  DISMISS_REASON_LABELS,
  ISSUE_SEVERITIES,
  RESOURCE_TYPE_NOUNS,
} from './Issues.constants'
import { anchorLogTimeRange } from '@/components/interfaces/QuerySources/LogTimeRange.utils'
import { formatTimeRange } from '@/components/ui/AIAssistantPanel/AssistantNotebookPreview.utils'
import type {
  Issue,
  IssueActor,
  IssueAffectedResource,
  IssueDocument,
  IssueEpisode,
  IssueEvent,
  IssueResource,
  IssueResourceMute,
  IssueStatus,
} from '@/data/issues/issue-schema'

export type IssueStatusView = 'open' | 'snoozed' | 'closed'

export const ISSUE_STATUS_VIEW_STATUSES: Record<IssueStatusView, IssueStatus[]> = {
  open: ['open'],
  snoozed: ['snoozed'],
  closed: ['resolved', 'dismissed'],
}

export function formatIssueResource(resource: IssueResource) {
  return resource.schema ? `${resource.schema}.${resource.name}` : resource.name
}

/** Compact age for narrow list rows: `now`, `12m`, `5h`, `3d`, `6w`. */
export function formatIssueAge(timestamp: string, now: number = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - new Date(timestamp).getTime()) / 60_000))
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d`
  return `${Math.floor(days / 7)}w`
}

export function getIssueStatusViewCount(
  counts: Record<IssueStatus, number> | undefined,
  view: IssueStatusView
) {
  if (!counts) return undefined
  return ISSUE_STATUS_VIEW_STATUSES[view].reduce((total, status) => total + counts[status], 0)
}

export function getOpenResources(issue: Pick<Issue, 'affected'>) {
  return issue.affected.filter((affected) => affected.status === 'open')
}

/**
 * What an issue affects, in a few words: the resource itself when there's one, otherwise a
 * count by type, e.g. `3 tables` or `2 tables and 1 view`. Null when there's nothing.
 */
export function summarizeAffected(affected: Pick<IssueAffectedResource, 'resource' | 'key'>[]) {
  if (affected.length === 0) return null
  if (affected.length === 1) return getResourceLabel(affected[0])

  // Keyed by the plural so types that share a noun, like `project` and none, count together
  const counts = new Map<string, { noun: { one: string; other: string }; count: number }>()
  for (const { resource } of affected) {
    const noun = RESOURCE_TYPE_NOUNS[resource?.type ?? 'other']
    counts.set(noun.other, { noun, count: (counts.get(noun.other)?.count ?? 0) + 1 })
  }
  return formatLabelList(
    Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .map(({ noun, count }) => `${count} ${count === 1 ? noun.one : noun.other}`)
  )
}

/** Unmuted resources first, then by severity and name, so what still needs fixing leads. */
export function sortAffected(affected: IssueAffectedResource[]) {
  return [...affected].sort(
    (a, b) =>
      Number(a.muted !== null) - Number(b.muted !== null) ||
      ISSUE_SEVERITIES.indexOf(a.severity) - ISSUE_SEVERITIES.indexOf(b.severity) ||
      getResourceLabel(a).localeCompare(getResourceLabel(b))
  )
}

/** Why a resource is muted, e.g. `Muted as accepted risk until Oct 30`. */
export function describeResourceMute(muted: IssueResourceMute) {
  if (muted.source === 'issue') return 'Muted with the issue'
  return [
    'Muted',
    muted.reason && `as ${DISMISS_REASON_LABELS[muted.reason].toLowerCase()}`,
    muted.until && `until ${dayjs(muted.until).format('MMM D')}`,
  ]
    .filter(Boolean)
    .join(' ')
}

export function getActorDescription(actor: IssueActor) {
  if (actor.type === 'system') return 'Automated check'
  if (actor.type === 'user' && actor.via) return `${actor.name} via ${actor.via.client}`
  return actor.name
}

export function getIssueSourceLabel({
  created_by: actor,
  category,
}: Pick<Issue, 'created_by' | 'category'>) {
  if (actor.type === 'system') return CATEGORY_LABELS[category]
  if (actor.type === 'assistant') return 'Assistant'
  return getActorDescription(actor)
}

/** What a notification rule covers, for its list row: every issue, its one check, or a count. */
export function formatNotificationRuleChecks(
  checkIds: string[],
  checkTitles: ReadonlyMap<string, string>
) {
  if (checkIds.length === 0) return 'All issues'
  if (checkIds.length === 1) return checkTitles.get(checkIds[0]) ?? '1 check'
  return `${checkIds.length} checks`
}

/**
 * A document as plain text, with query cells as fenced SQL, for prompts and search. A log
 * query names the period it covers, counted back from the document's `as_of`.
 */
export function documentToMarkdown(document: IssueDocument) {
  return document.cells
    .map((cell) => {
      if (cell._tag === 'markdown_cell') return cell.text
      const source =
        cell._tag === 'log_cell'
          ? `logs, ${formatTimeRange(anchorLogTimeRange(cell.time_range, document.as_of))}`
          : 'database'
      return [`${cell.title ?? 'Query'} (${source}):`, '```sql', cell.sql, '```'].join('\n')
    })
    .join('\n\n')
}

/** Context handed to the Assistant, or copied for another agent, about an issue. */
export function buildIssuePrompt(issue: Issue) {
  const affectedLines = getOpenResources(issue).map((item) => {
    const label = item.resource ? formatIssueResource(item.resource) : item.key
    return `- ${label}${item.detail ? `: ${item.detail}` : ''}`
  })

  return [
    `Look into this Supabase issue (id \`${issue.id}\`) in my project and suggest a fix.`,
    '',
    `Title: ${issue.title}`,
    `Severity: ${issue.severity}`,
    `Category: ${issue.category}`,
    `Status: ${issue.status}`,
    `First seen ${issue.first_seen_at}, last seen ${issue.last_seen_at}.`,
    ...(issue.previous_issue_id
      ? [`It happened before as issue \`${issue.previous_issue_id}\`, which was resolved.`]
      : []),
    ...(affectedLines.length > 0 ? ['', 'Where it shows up:', ...affectedLines] : []),
    '',
    documentToMarkdown(issue.body),
  ].join('\n')
}

export type IssueTimelineItem =
  | { type: 'event'; at: string; event: IssueEvent }
  // Episodes that started together, e.g. one run finding several tables. A regression is
  // shown on the row of the episodes that caused it rather than as a row of its own.
  | { type: 'episodes'; at: string; episodes: IssueEpisode[]; isRegression: boolean }
  // Several rows of episodes in a row with nothing else between them
  | { type: 'episode_summary'; at: string; episodes: IssueEpisode[] }

/** Rows of episodes in a row before they collapse into one summary row. */
export const MAX_CONSECUTIVE_EPISODE_ROWS = 3

const isRegressionEvent = (event: IssueEvent) =>
  event.type === 'status_changed' &&
  event.actor.type === 'system' &&
  event.from === 'resolved' &&
  event.to === 'open'

/**
 * Events and episodes in time order, so a check that runs every few minutes adds a row per
 * failing stretch rather than per run. Episodes that started together share a row, a check
 * reopening a resolved issue joins the row of the episodes it reopened for, and a longer
 * streak of episode rows with nothing else between them becomes one summary row.
 */
export function buildIssueTimeline(
  events: IssueEvent[],
  episodes: IssueEpisode[]
): IssueTimelineItem[] {
  const episodesByStart = new Map<string, IssueEpisode[]>()
  for (const episode of episodes) {
    episodesByStart.set(episode.started_at, [
      ...(episodesByStart.get(episode.started_at) ?? []),
      episode,
    ])
  }
  const items: IssueTimelineItem[] = [
    ...events.map((event): IssueTimelineItem => ({ type: 'event', at: event.created_at, event })),
    ...Array.from(
      episodesByStart,
      ([at, group]): IssueTimelineItem => ({
        type: 'episodes',
        at,
        episodes: group,
        isRegression: false,
      })
    ),
  ]
    // Episodes before events at the same moment: a lint's episode starts in the run that
    // reopens the issue
    .sort(
      (a, b) => a.at.localeCompare(b.at) || Number(a.type === 'event') - Number(b.type === 'event')
    )

  // The run that reopens an issue is the one that opened the episode just before it
  const folded: IssueTimelineItem[] = []
  for (const item of items) {
    const previous = folded.at(-1)
    if (item.type === 'event' && isRegressionEvent(item.event) && previous?.type === 'episodes') {
      folded[folded.length - 1] = { ...previous, isRegression: true }
      continue
    }
    folded.push(item)
  }

  const timeline: IssueTimelineItem[] = []
  let streak: IssueTimelineItem[] = []
  const endStreak = () => {
    if (streak.length > MAX_CONSECUTIVE_EPISODE_ROWS) {
      timeline.push({
        type: 'episode_summary',
        at: streak[0].at,
        episodes: streak.flatMap((item) => (item.type === 'event' ? [] : item.episodes)),
      })
    } else {
      timeline.push(...streak)
    }
    streak = []
  }

  for (const item of folded) {
    // A regression stays its own row rather than disappearing into a summary
    if (item.type === 'episodes' && !item.isRegression) {
      streak.push(item)
      continue
    }
    endStreak()
    timeline.push(item)
  }
  endStreak()
  return timeline
}

export function getResourceLabel(affected: Pick<IssueAffectedResource, 'resource' | 'key'>) {
  return affected.resource ? formatIssueResource(affected.resource) : affected.key
}

/** `a`, `a and b`, `a, b and c`, or `a, b and 3 more`. */
export function formatLabelList(labels: string[]) {
  const unique = Array.from(new Set(labels))
  if (unique.length <= 1) return unique[0] ?? ''
  if (unique.length <= 3) return `${unique.slice(0, -1).join(', ')} and ${unique.at(-1)}`
  return `${unique.slice(0, 2).join(', ')} and ${unique.length - 2} more`
}

const pluralize = (count: number, unit: string) => `${count} ${unit}${count === 1 ? '' : 's'}`

/** An exact length of time, e.g. `45 minutes` or `3 hours 5 minutes`, unlike dayjs's rounding. */
export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  if (minutes < 1) return 'less than a minute'
  if (minutes < 60) return pluralize(minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return [pluralize(hours, 'hour'), minutes % 60 > 0 && pluralize(minutes % 60, 'minute')]
      .filter(Boolean)
      .join(' ')
  }
  const days = Math.floor(hours / 24)
  return [pluralize(days, 'day'), hours % 24 > 0 && pluralize(hours % 24, 'hour')]
    .filter(Boolean)
    .join(' ')
}

/** A measured value with its unit, e.g. `4.6%`, or null when there's no value. */
export function formatIssueValue(value: number | null, unit: string | null) {
  if (value === null) return null
  return `${value.toLocaleString()}${unit ?? ''}`
}

/** What a row of episodes is about: where they happened and the highest value they reached. */
export function summarizeEpisodes(issue: Pick<Issue, 'affected'>, episodes: IssueEpisode[]) {
  const affected = episodes.flatMap(
    (episode) => issue.affected.find((item) => item.id === episode.affected_id) ?? []
  )
  const peaks = episodes.flatMap(({ peak_value }) => (peak_value === null ? [] : [peak_value]))
  const ends = episodes.flatMap(({ ended_at }) => (ended_at === null ? [] : [ended_at]))

  return {
    label: formatLabelList(affected.map(getResourceLabel)),
    peak: peaks.length > 0 ? formatIssueValue(Math.max(...peaks), affected[0]?.unit ?? null) : null,
    startedAt: episodes.map(({ started_at }) => started_at).sort()[0],
    // Null while any of them is still failing
    endedAt: ends.length === episodes.length ? (ends.sort().at(-1) ?? null) : null,
    clearedCount: ends.length,
  }
}

/**
 * One timeline row for what a check saw, worded the same for every check, e.g. `Detected on
 * Data API for 45 minutes · peak 4.6%`. A summary row covers several in a row.
 */
export function describeEpisodes({
  issue,
  episodes,
  isSummary,
  isRegression = false,
  now = new Date().toISOString(),
}: {
  issue: Pick<Issue, 'affected'>
  episodes: IssueEpisode[]
  isSummary: boolean
  isRegression?: boolean
  now?: string
}) {
  const { label, peak, startedAt, endedAt, clearedCount } = summarizeEpisodes(issue, episodes)
  const duration = formatDuration(dayjs(endedAt ?? now).diff(dayjs(startedAt), 'second'))
  const detected = `Detected ${isRegression ? 'again ' : ''}on ${label}`
  const parts: string[] = []

  if (isSummary) parts.push(`${detected} ${episodes.length} times over ${duration}`)
  else if (endedAt !== null) parts.push(`${detected} for ${duration}`)
  else if (clearedCount > 0) parts.push(detected, `${clearedCount} of ${episodes.length} cleared`)
  else parts.push(`${detected} for ${duration} so far`)

  if (peak) parts.push(`peak ${peak}`)
  return parts.join(' · ')
}
