export const profileKeys = {
  profile: () => ['profile'] as const,
  mfaFactors: (userId?: string) =>
    userId ? (['mfa', 'factors', userId] as const) : (['mfa', 'factors'] as const),
  identities: (userId?: string) =>
    userId ? (['profile', 'identities', userId] as const) : (['profile', 'identities'] as const),
  aaLevel: (userId?: string) =>
    userId ? (['mfa', 'aaLevel', userId] as const) : (['mfa', 'aaLevel'] as const),
  auditLogs: ({
    date_start,
    date_end,
  }: {
    date_start: string | undefined
    date_end: string | undefined
  }) => ['profile', 'audit-logs', { date_start, date_end }] as const,
}
