export const workflowRunKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'workflow-runs'] as const,
  detail: (workflowRunId: string | undefined) => ['workflow-runs', workflowRunId] as const,
}
