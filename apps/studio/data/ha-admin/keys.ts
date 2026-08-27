export const haAdminKeys = {
  poolers: (projectRef: string | undefined) =>
    ['projects', projectRef, 'ha-admin', 'poolers'] as const,
  gateways: (projectRef: string | undefined) =>
    ['projects', projectRef, 'ha-admin', 'gateways'] as const,
}
