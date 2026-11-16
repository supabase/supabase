export const alertIssuesKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'alert-issues'] as const,
}
