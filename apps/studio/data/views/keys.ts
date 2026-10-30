export const viewKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'views'] as const,
  listBySchema: (projectRef: string | undefined, schemas?: string[]) =>
    [...viewKeys.list(projectRef), schemas].filter(Boolean),
}
