export const materializedViewKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'materializedViews'] as const,
  listBySchema: (projectRef: string | undefined, schemas?: string[]) =>
    [...materializedViewKeys.list(projectRef), schemas].filter(Boolean),
}
