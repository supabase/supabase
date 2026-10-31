export const recoveryCodeKeys = {
  status: (userId?: string) => ['recovery-code-status-query', userId].filter(Boolean),
}
