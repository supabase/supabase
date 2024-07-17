export const logDrainsKeys = {
  logDrains: (projectRef: string | undefined) => ['projects', projectRef, 'log-drains'] as const,
}
