export const projectKeys = {
  list: () => ['all-projects'] as const,
  status: (projectRef: string | undefined) => ['project', projectRef, 'status'] as const,
  types: (projectRef: string | undefined) => ['project', projectRef, 'types'] as const,
  detail: (projectRef: string | undefined) => ['project', projectRef, 'detail'] as const,
  serviceVersions: (projectRef: string | undefined) =>
    ['project', projectRef, 'service-versions'] as const,
  readonlyStatusList: () => ['projects', 'readonly-statuses'] as const,
  readonlyStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'readonly-status'] as const,
  projectTransfer: (projectRef: string | undefined, targetOrganizationSlug: string | undefined) =>
    ['projects', 'transfer', projectRef, targetOrganizationSlug] as const,
  projectTransferPreview: (
    projectRef: string | undefined,
    targetOrganizationSlug: string | undefined
  ) => ['projects', 'transfer', projectRef, targetOrganizationSlug, 'preview'] as const,
  pauseStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'pause-status'] as const,

  orgProjects: (slug: string | undefined) => ['projects', 'org', slug] as const,

  // Clone to new project
  listCloneBackups: (projectRef: string | undefined) =>
    ['projects', projectRef, 'clone-backups'] as const,
  listCloneStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'clone-status'] as const,
}
