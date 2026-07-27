export const restorePointKeys = {
  coverage: (projectRef: string | undefined) =>
    ['projects', projectRef, 'restore-point-coverage'] as const,
  protectionSummary: (projectRef: string | undefined) =>
    ['projects', projectRef, 'platform-protection-summary'] as const,
  storageBackupSync: (projectRef: string | undefined) =>
    ['projects', projectRef, 'storage-backup-sync'] as const,
}
