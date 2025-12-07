export const chatSessionKeys = {
  list: (projectRef?: string) => ['projects', projectRef, 'chat-sessions'] as const,
  detail: (id: string) => ['chat-sessions', id] as const,
  messages: (id: string) => ['chat-sessions', id, 'messages'] as const,
}
