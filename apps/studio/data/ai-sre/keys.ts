export const aiSreKeys = {
  config: (projectRef: string | undefined) => ['projects', projectRef, 'ai-sre', 'config'] as const,
  runs: (projectRef: string | undefined) => ['projects', projectRef, 'ai-sre', 'runs'] as const,
}
