export const alertIssuesKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'alert-issues'] as const,
  comments: (projectRef: string | undefined, alertIssueId: string | undefined) =>
    ['projects', projectRef, 'alert-issues', alertIssueId, 'comments'] as const,
  events: (projectRef: string | undefined, alertIssueId: string | undefined, range: string) =>
    ['projects', projectRef, 'alert-issues', alertIssueId, 'events', range] as const,
  types: (projectRef: string | undefined) => ['projects', projectRef, 'alert-issue-types'] as const,
}
