export const BannedIPKeys = {
    list: (projectRef: string | undefined) => ['projects', projectRef, 'banned-ips'] as const,
    detail: (ip: string[] | undefined) => ['banned-ips', ip] as const,
  }