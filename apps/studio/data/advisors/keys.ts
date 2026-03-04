export const advisorKeys = {
  issues: (projectRef: string | undefined) =>
    ['projects', projectRef, 'advisor-issues'] as const,
  issue: (projectRef: string | undefined, issueId: string | undefined) =>
    ['projects', projectRef, 'advisor-issues', issueId] as const,
  rules: (projectRef: string | undefined) =>
    ['projects', projectRef, 'advisor-rules'] as const,
  rule: (projectRef: string | undefined, ruleId: string | undefined) =>
    ['projects', projectRef, 'advisor-rules', ruleId] as const,
  alerts: (projectRef: string | undefined, issueId?: string) =>
    ['projects', projectRef, 'advisor-alerts', issueId] as const,
  agents: (projectRef: string | undefined) =>
    ['projects', projectRef, 'advisor-agents'] as const,
  agentTasks: (projectRef: string | undefined) =>
    ['projects', projectRef, 'advisor-agent-tasks'] as const,
  channels: (projectRef: string | undefined) =>
    ['projects', projectRef, 'advisor-channels'] as const,
  conversations: (projectRef: string | undefined, issueId?: string) =>
    ['projects', projectRef, 'advisor-conversations', issueId] as const,
  taskConversations: (projectRef: string | undefined, taskId?: string) =>
    ['projects', projectRef, 'advisor-task-conversations', taskId] as const,
}
