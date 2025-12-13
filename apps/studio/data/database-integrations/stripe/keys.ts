export const stripeSyncKeys = {
  all: ['stripe-sync'] as const,
  syncState: (projectRef: string | undefined) =>
    [...stripeSyncKeys.all, 'sync-state', projectRef] as const,
  installationStatus: (projectRef: string | undefined) =>
    [...stripeSyncKeys.all, 'installation-status', projectRef] as const,
}
