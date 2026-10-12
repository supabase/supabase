export const recoveryCodeKeys = {
  status: (userId?: string) =>
    userId
      ? (['recovery-code-status-query', userId] as const)
      : (['recovery-code-status-query'] as const),
}
