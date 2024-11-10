export const viewKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'views'] as const,
  listBySchema: (projectRef: string | undefined, schema: string) =>
    [...viewKeys.list(projectRef), schema] as const,
}
