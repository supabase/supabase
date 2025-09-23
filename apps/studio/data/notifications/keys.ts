export const notificationKeys = {
  list: () => ['notifications'] as const,
  listV2: (options?: { status?: string; limit: number; filters: any }) =>
    ['notifications', options] as const,
  summary: () => ['notifications', 'summary'] as const,
}
