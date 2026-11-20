export const stripeSyncKeys = {
  all: ['stripe-sync'] as const,
  syncState: (projectRef: string) => [...stripeSyncKeys.all, 'sync-state', projectRef] as const,
  installationStatus: (projectRef: string) =>
    [...stripeSyncKeys.all, 'installation-status', projectRef] as const,
}
