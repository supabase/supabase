export const contentKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'content'] as const,
}
