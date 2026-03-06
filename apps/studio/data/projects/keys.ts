export const INFINITE_PROJECTS_KEY_PREFIX = 'all-projects-infinite'

export const projectKeys = {
  infiniteList: (params?: {
    limit: number
    sort?: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc'
    search?: string
  }) => [INFINITE_PROJECTS_KEY_PREFIX, params].filter(Boolean),
  infiniteListByOrg: (
    slug: string | undefined,
    params?: {
      limit: number
      sort?: 'name_asc' | 'name_desc' | 'created_asc' | 'created_desc'
      search?: string
      statuses?: string[]
    }
  ) => [INFINITE_PROJECTS_KEY_PREFIX, slug, params].filter(Boolean),
  status: (projectRef: string | undefined) => ['project', projectRef, 'status'] as const,
  types: (projectRef: string | undefined) => ['project', projectRef, 'types'] as const,
  detail: (projectRef: string | undefined) => ['project', projectRef, 'detail'] as const,
  serviceVersions: (projectRef: string | undefined) =>
    ['project', projectRef, 'service-versions'] as const,
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

  // Clone to new project
  listCloneBackups: (projectRef: string | undefined) =>
    ['projects', projectRef, 'clone-backups'] as const,
  listCloneStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'clone-status'] as const,

  // Banner-specific: first-page snapshot used by the status page banner hook
  bannerProjectsByOrg: (slug: string) => ['banner', 'org-projects', slug] as const,
}
