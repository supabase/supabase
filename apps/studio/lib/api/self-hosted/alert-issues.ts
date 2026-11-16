import assert from 'node:assert'

import { WrappedResult } from './types'
import { assertSelfHosted } from './util'
import { PROJECT_ANALYTICS_URL } from '@/lib/constants/api'

/** Self-hosted Studio has a single dashboard user, so read state is tracked for one reader. */
const SELF_HOSTED_READER = 'self-hosted'

export type AlertIssueAction = 'acknowledge' | 'snooze' | 'resolve' | 'reopen'

function projectFilter(projectRef: string) {
  return { 'identifiers.project': projectRef }
}

async function logflareRequest(
  path: string,
  init: { method: 'GET' | 'POST'; searchParams?: Record<string, string>; body?: unknown }
): Promise<WrappedResult<unknown>> {
  assertSelfHosted()
  assert(PROJECT_ANALYTICS_URL, 'PROJECT_ANALYTICS_URL is required')
  assert(process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN, 'LOGFLARE_PRIVATE_ACCESS_TOKEN is required')

  const url = new URL(`${PROJECT_ANALYTICS_URL}${path}`)
  Object.entries(init.searchParams ?? {}).forEach(([key, value]) =>
    url.searchParams.set(key, value)
  )

  try {
    const response = await fetch(url.toString(), {
      method: init.method,
      headers: {
        'x-api-key': process.env.LOGFLARE_PRIVATE_ACCESS_TOKEN,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...(init.body !== undefined && { body: JSON.stringify(init.body) }),
    })

    const result = await response.json()

    if (!response.ok) {
      const message =
        typeof result?.error === 'string'
          ? result.error
          : (result?.error?.message ?? `Failed to reach Logflare: ${response.statusText}`)
      return { data: undefined, error: new Error(message) }
    }

    return { data: result, error: undefined }
  } catch (error) {
    if (error instanceof Error) return { data: undefined, error }
    throw error
  }
}

/**
 * Lists the project's alert issues from Logflare with an unread flag for the dashboard user.
 *
 * _Only call this from server-side self-hosted code._
 */
export function listAlertIssues({
  projectRef,
  status,
  since,
}: {
  projectRef: string
  status?: string
  since?: string
}) {
  return logflareRequest('alerts/issues', {
    method: 'GET',
    searchParams: {
      'filters[identifiers.project]': projectRef,
      reader: SELF_HOSTED_READER,
      ...(status && { status }),
      ...(since && { since }),
    },
  })
}

/**
 * Applies an action (acknowledge, snooze, resolve, reopen) to one of the project's alert issues.
 *
 * _Only call this from server-side self-hosted code._
 */
export function applyAlertIssueAction({
  projectRef,
  alertIssueId,
  action,
  until,
}: {
  projectRef: string
  alertIssueId: string
  action: AlertIssueAction
  until?: string
}) {
  return logflareRequest(`alerts/issues/${encodeURIComponent(alertIssueId)}/actions`, {
    method: 'POST',
    body: {
      action,
      actor: SELF_HOSTED_READER,
      filters: projectFilter(projectRef),
      ...(until && { until }),
    },
  })
}

/**
 * Marks the project's alert issues read or unread for the dashboard user.
 *
 * _Only call this from server-side self-hosted code._
 */
export function markAlertIssuesRead({
  projectRef,
  alertIssueIds,
  read,
}: {
  projectRef: string
  alertIssueIds: string[]
  read: boolean
}) {
  return logflareRequest('alerts/issues/reads', {
    method: 'POST',
    body: {
      alert_issue_ids: alertIssueIds,
      reader: SELF_HOSTED_READER,
      read,
      filters: projectFilter(projectRef),
    },
  })
}
