export const notificationKeys = {
  list: () => ['notifications'] as const,
  listV2: (options?: { status?: string; priority?: string; limit: number }) =>
    ['notifications', options] as const,
  summary: () => ['notifications', 'summary'] as const,
}
