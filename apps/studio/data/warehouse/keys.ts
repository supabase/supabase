export const warehouseKeys = {
  tables: (projectRef: string | undefined) =>
    ['projects', projectRef, 'warehouse', 'tables'] as const,
  catalog: (projectRef: string | undefined) =>
    ['projects', projectRef, 'warehouse', 'catalog'] as const,
  setupStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'warehouse', 'setup-status'] as const,
}
