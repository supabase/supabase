export const warehouseKeys = {
  setupStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'warehouse', 'setup-status'] as const,
  catalog: (projectRef: string | undefined) =>
    ['projects', projectRef, 'warehouse', 'catalog'] as const,
}
