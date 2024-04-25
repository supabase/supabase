export const contentKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'content'] as const,
  folders: (projectRef: string | undefined) =>
    ['projects', projectRef, 'content', 'folders'] as const,
}
