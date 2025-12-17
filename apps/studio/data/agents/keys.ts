export const agentKeys = {
  list: (projectRef?: string) => ['projects', projectRef, 'agents'] as const,
  detail: (id: string) => ['agents', id] as const,
  messages: (id: string) => ['agents', id, 'messages'] as const,
}
