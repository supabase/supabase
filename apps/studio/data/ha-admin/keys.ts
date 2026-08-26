export const haAdminKeys = {
  cells: (projectRef: string | undefined) => ['projects', projectRef, 'ha-admin', 'cells'] as const,
  databases: (projectRef: string | undefined) =>
    ['projects', projectRef, 'ha-admin', 'databases'] as const,
  poolers: (projectRef: string | undefined) =>
    ['projects', projectRef, 'ha-admin', 'poolers'] as const,
  gateways: (projectRef: string | undefined) =>
    ['projects', projectRef, 'ha-admin', 'gateways'] as const,
}
