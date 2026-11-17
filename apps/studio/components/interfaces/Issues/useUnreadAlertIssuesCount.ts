import { useQuery } from '@tanstack/react-query'

import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'
import { alertIssuesQueryOptions } from '@/data/alert-issues/alert-issues-query'

const countUnread = (issues: AlertIssue[]) =>
  issues.filter((issue) => issue.unread && issue.status !== 'resolved').length

/**
 * Unread alert issues that still need attention, for the header badge. Self-hosted only, like
 * the alert issues inbox; it polls with the inbox's interval.
 */
export function useUnreadAlertIssuesCount(projectRef: string | undefined) {
  const { data } = useQuery({ ...alertIssuesQueryOptions({ projectRef }), select: countUnread })
  return data ?? 0
}
