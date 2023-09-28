export const BannedIPKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'banned-ips'] as const,
  detail: (ips: string[] | undefined) => ['banned-ips', ips] as const,
}
