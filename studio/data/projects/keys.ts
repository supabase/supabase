export const projectKeys = {
  list: () => ['all-projects'] as const,
  detail: (projectRef: string | undefined) => ['project', projectRef, 'detail'] as const,
  readonlyStatusList: () => ['projects', 'readonly-statuses'] as const,
  readonlyStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'readonly-status'] as const,
  projectTransfer: (projectRef: string | undefined, targetOrganizationSlug: string | undefined) =>
    ['projects', 'transfer', projectRef, targetOrganizationSlug] as const,
  projectTransferPreview: (
    projectRef: string | undefined,
    targetOrganizationSlug: string | undefined
  ) => ['projects', 'transfer', projectRef, targetOrganizationSlug, 'preview'] as const,
}
