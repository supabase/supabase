export const notificationKeys = {
  list: () => ['notifications'] as const,
  listV2: (options: { archived?: boolean; offset: number; limit: number }) =>
    ['notifications', options] as const,
}
