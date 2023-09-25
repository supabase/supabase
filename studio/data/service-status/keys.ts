export const serviceStatusKeys = {
  postgres: (projectRef: string | undefined) =>
    ['projects', projectRef, 'service-status', 'postgres'] as const,
  postgrest: (projectRef: string | undefined) =>
    ['projects', projectRef, 'service-status', 'postgrest'] as const,
  storage: (projectRef: string | undefined) =>
    ['projects', projectRef, 'service-status', 'storage'] as const,
  realtime: (projectRef: string | undefined) =>
    ['projects', projectRef, 'service-status', 'realtime'] as const,
  auth: (projectRef: string | undefined) =>
    ['projects', projectRef, 'service-status', 'auth'] as const,
  pooler: (projectRef: string | undefined) =>
    ['projects', projectRef, 'service-status', 'pooler'] as const,
}
