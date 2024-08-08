export const BannedIPKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'banned-ips'] as const,
}
