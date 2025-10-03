export const actionKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'actions'] as const,
  detail: (projectRef: string | undefined, runId: string | undefined) =>
    ['projects', projectRef, 'actions', runId] as const,
}
