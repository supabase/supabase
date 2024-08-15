export const viewKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'views'] as const,
  listBySchema: (projectRef: string | undefined, schema: string) =>
    [...viewKeys.list(projectRef), schema] as const,
  view: (projectRef: string | undefined, id: number | undefined) =>
    [...viewKeys.list(projectRef), id] as const,
}
