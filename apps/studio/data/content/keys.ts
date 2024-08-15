export const contentKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'content'] as const,
  folders: (projectRef: string | undefined, id?: string) =>
    ['projects', projectRef, 'content', 'folders', id].filter(Boolean),
  resource: (projectRef: string | undefined, id?: string) =>
    ['projects', projectRef, 'content', id] as const,
  count: (projectRef: string | undefined, type?: string) =>
    ['projects', projectRef, 'content', 'count', type].filter(Boolean),
}
