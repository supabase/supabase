export const aiAssistantKeys = {
  conversations: (projectRef: string | undefined) =>
    ['assistant', 'projects', projectRef, 'conversations'] as const,
  conversation: (id: string | undefined) => ['assistant', 'conversation', id] as const,
}
