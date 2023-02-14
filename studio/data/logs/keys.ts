export const logKeys = {
  logStats: (projectRef: string | undefined, interval: string | undefined) =>
    ['projects', projectRef, 'log-stats', interval] as const,
}
