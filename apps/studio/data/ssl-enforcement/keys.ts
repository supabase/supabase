export const sslEnforcementKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'ssl-enforcement'] as const,
}
