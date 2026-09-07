export const aiAssistantKeys = {
  me: (userId: string | undefined) => ['assistant', 'me', userId] as const,
  projectPermissions: (projectRef: string | undefined, orgSlug: string | undefined) =>
    ['assistant', 'permissions', projectRef, orgSlug] as const,
  conversations: (projectRef: string | undefined) =>
    ['assistant', 'projects', projectRef, 'conversations'] as const,
  conversation: (id: string | undefined) => ['assistant', 'conversation', id] as const,
}
