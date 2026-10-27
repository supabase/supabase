export const profileKeys = {
  profile: () => ['profile'] as const,
  mfaFactors: (userId?: string) => ['mfa', 'factors', userId].filter(Boolean),
  identities: (userId?: string) => ['profile', 'identities', userId].filter(Boolean),
  aaLevel: (userId?: string) => ['mfa', 'aaLevel', userId].filter(Boolean),
  auditLogs: ({
    date_start,
    date_end,
  }: {
    date_start: string | undefined
    date_end: string | undefined
  }) => ['profile', 'audit-logs', { date_start, date_end }] as const,
}
