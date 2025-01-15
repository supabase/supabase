export const workflowRunKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'workflow-runs'] as const,
}
