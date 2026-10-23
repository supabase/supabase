import type { IssueListFilters } from './issue-schema'

export const issuesKeys = {
  all: (projectRef: string | undefined) => ['projects', projectRef, 'issues'] as const,
  checks: (projectRef: string | undefined) => ['projects', projectRef, 'issues', 'checks'] as const,
  notificationRules: (projectRef: string | undefined) =>
    ['projects', projectRef, 'issues', 'notification-rules'] as const,
  list: (projectRef: string | undefined, filters: IssueListFilters) =>
    ['projects', projectRef, 'issues', 'list', filters] as const,
  detail: (projectRef: string | undefined, id: string | undefined) =>
    ['projects', projectRef, 'issues', 'detail', id] as const,
  timeline: (projectRef: string | undefined, id: string | undefined) =>
    ['projects', projectRef, 'issues', 'timeline', id] as const,
}
