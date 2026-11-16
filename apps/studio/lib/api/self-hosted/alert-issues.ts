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

function projectFilterParams(projectRef: string) {
  return { 'filters[identifiers.project]': projectRef }
}

/** A failed Logflare request, keeping the HTTP status so routes can pass client errors through. */
export class LogflareRequestError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message)
    this.name = 'LogflareRequestError'
  }
}

/** Logflare statuses that describe the request itself and are safe to return to the browser. */
const CLIENT_ERROR_STATUSES = [400, 404, 409, 422]

/** The status a self-hosted route should answer with for a failed Logflare request. */
export function getProxyErrorStatus(error: Error) {
  return error instanceof LogflareRequestError && CLIENT_ERROR_STATUSES.includes(error.status)
    ? error.status
    : 500
}

async function logflareRequest(
  path: string,
  init: {
    method: 'GET' | 'POST' | 'DELETE'
    searchParams?: Record<string, string>
    body?: unknown
  }
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

    if (response.status === 204) return { data: null, error: undefined }

    const result = await response.json()

    if (!response.ok) {
      const message =
        typeof result?.error === 'string'
          ? result.error
          : (result?.error?.message ?? `Failed to reach Logflare: ${response.statusText}`)
      return { data: undefined, error: new LogflareRequestError(message, response.status) }
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

/**
 * Lists the comments on one of the project's alert issues, oldest first.
 *
 * _Only call this from server-side self-hosted code._
 */
export function listAlertIssueComments({
  projectRef,
  alertIssueId,
}: {
  projectRef: string
  alertIssueId: string
}) {
  return logflareRequest(`alerts/issues/${encodeURIComponent(alertIssueId)}/comments`, {
    method: 'GET',
    searchParams: projectFilterParams(projectRef),
  })
}

/**
 * Adds a comment to one of the project's alert issues as the dashboard user.
 *
 * _Only call this from server-side self-hosted code._
 */
export function createAlertIssueComment({
  projectRef,
  alertIssueId,
  body,
}: {
  projectRef: string
  alertIssueId: string
  body: string
}) {
  return logflareRequest(`alerts/issues/${encodeURIComponent(alertIssueId)}/comments`, {
    method: 'POST',
    searchParams: projectFilterParams(projectRef),
    body: { author: SELF_HOSTED_READER, body },
  })
}

/**
 * Returns the log events behind one of the project's alert issues, using the preview LQL of
 * its alert issue type.
 *
 * _Only call this from server-side self-hosted code._
 */
export function getAlertIssueEvents({
  projectRef,
  alertIssueId,
  from,
  to,
}: {
  projectRef: string
  alertIssueId: string
  from?: string
  to?: string
}) {
  return logflareRequest(`alerts/issues/${encodeURIComponent(alertIssueId)}/events`, {
    method: 'GET',
    searchParams: {
      ...projectFilterParams(projectRef),
      ...(from && { from }),
      ...(to && { to }),
    },
  })
}

/**
 * Runs an LQL filter over a time range and returns the matching log events.
 *
 * _Only call this from server-side self-hosted code._
 */
export function previewAlertRule({ lql, from, to }: { lql: string; from?: string; to?: string }) {
  return logflareRequest('alerts/preview', {
    method: 'POST',
    body: { lql, ...(from && { from }), ...(to && { to }) },
  })
}

/**
 * Lists the alert issue types (managed and custom rules) with the project's silence state.
 *
 * _Only call this from server-side self-hosted code._
 */
export function listAlertIssueTypes({ projectRef }: { projectRef: string }) {
  return logflareRequest('alerts/issue_types', {
    method: 'GET',
    searchParams: projectFilterParams(projectRef),
  })
}

/**
 * Creates a custom alert issue type: an LQL rule that Logflare evaluates on a schedule.
 *
 * _Only call this from server-side self-hosted code._
 */
export function createAlertIssueType({
  projectRef,
  ...rule
}: {
  projectRef: string
  name: string
  lql: string
  severity: string
  category: string
  description?: string
  group_by?: string[]
}) {
  return logflareRequest('alerts/issue_types', {
    method: 'POST',
    body: { ...rule, identifiers: { project: projectRef } },
  })
}

/**
 * Deletes a custom alert issue type.
 *
 * _Only call this from server-side self-hosted code._
 */
export function deleteAlertIssueType({ ruleKey }: { ruleKey: string }) {
  return logflareRequest(`alerts/issue_types/${encodeURIComponent(ruleKey)}`, {
    method: 'DELETE',
  })
}

/**
 * Silences an alert issue type for the project. Its alert issues are still recorded but hidden.
 *
 * _Only call this from server-side self-hosted code._
 */
export function createAlertSilence({
  projectRef,
  ruleKey,
}: {
  projectRef: string
  ruleKey: string
}) {
  return logflareRequest('alerts/silences', {
    method: 'POST',
    body: { rule_key: ruleKey, matchers: { project: projectRef }, created_by: SELF_HOSTED_READER },
  })
}

/**
 * Deletes a silence.
 *
 * _Only call this from server-side self-hosted code._
 */
export function deleteAlertSilence({ silenceId }: { silenceId: string }) {
  return logflareRequest(`alerts/silences/${encodeURIComponent(silenceId)}`, { method: 'DELETE' })
}
