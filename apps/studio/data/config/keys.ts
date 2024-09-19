export const configKeys = {
  pgBouncerStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'pgbouncer'] as const,
  settings: (projectRef: string | undefined) => ['projects', projectRef, 'settings'] as const,
  api: (projectRef: string | undefined) => ['projects', projectRef, 'settings', 'api'] as const,
  postgrest: (projectRef: string | undefined) => ['projects', projectRef, 'postgrest'] as const,
  jwtSecretUpdatingStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'jwt-secret-updating-status'] as const,
  storage: (projectRef: string | undefined) => ['projects', projectRef, 'storage'] as const,
  upgradeEligibility: (projectRef: string | undefined) =>
    ['projects', projectRef, 'upgrade-eligibility'] as const,
  upgradeStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'upgrade-status'] as const,
  diskAttributes: (projectRef: string | undefined) =>
    ['projects', projectRef, 'disk-attributes'] as const,
  diskUtilization: (projectRef: string | undefined) =>
    ['projects', projectRef, 'disk-utilization'] as const,
}
