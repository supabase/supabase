export const logDrainsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'log-drains'] as const,
}
