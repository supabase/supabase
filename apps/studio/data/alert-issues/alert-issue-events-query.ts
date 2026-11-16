import { queryOptions } from '@tanstack/react-query'

import { alertLogEventsSchema } from './alert-issue.schema'
import { alertIssuesKeys } from './keys'
import { fetchGet } from '@/data/fetchers'
import { API_URL, IS_PLATFORM } from '@/lib/constants'
import { isStudioError } from '@/lib/errors/studio-errors'

export const ALERT_LOG_EVENT_RANGES = ['1h', '24h', '7d'] as const
export type AlertLogEventRange = (typeof ALERT_LOG_EVENT_RANGES)[number]

const RANGE_MS: Record<AlertLogEventRange, number> = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
}

/** The ISO time range ending now for a log event range. */
export function getAlertLogEventWindow(range: AlertLogEventRange, now = new Date()) {
  return {
    from: new Date(now.getTime() - RANGE_MS[range]).toISOString(),
    to: now.toISOString(),
  }
}

export type AlertIssueEventsVariables = {
  projectRef?: string
  alertIssueId?: string
  range: AlertLogEventRange
}

/** Logflare answers 422 when the alert issue type has no log preview. */
const NO_PREVIEW_STATUS = 422

async function getAlertIssueEvents(
  { projectRef, alertIssueId, range }: AlertIssueEventsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!alertIssueId) throw new Error('alertIssueId is required')

  const params = new URLSearchParams(getAlertLogEventWindow(range))
  const response = await fetchGet<unknown>(
    `${API_URL}/platform/projects/${projectRef}/alerts/issues/${encodeURIComponent(alertIssueId)}/events?${params}`,
    { abortSignal: signal }
  )
  if (isStudioError(response)) {
    if (response.code === NO_PREVIEW_STATUS) return null
    throw response
  }

  return alertLogEventsSchema.parse(response)
}

export type AlertIssueEventsData = Awaited<ReturnType<typeof getAlertIssueEvents>>

/** Log events behind an alert issue. Resolves to `null` when its type has no log preview. */
export const alertIssueEventsQueryOptions = ({
  projectRef,
  alertIssueId,
  range,
}: AlertIssueEventsVariables) =>
  queryOptions({
    queryKey: alertIssuesKeys.events(projectRef, alertIssueId, range),
    queryFn: ({ signal }) => getAlertIssueEvents({ projectRef, alertIssueId, range }, signal),
    enabled: !IS_PLATFORM && !!projectRef && !!alertIssueId,
  })
