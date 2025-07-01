export const workflowRunKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'workflow-runs'] as const,
  detail: (projectRef: string | undefined, workflowRunId: string | undefined) =>
    ['projects', projectRef, 'workflow-run', workflowRunId] as const,
}
