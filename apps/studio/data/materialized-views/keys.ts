export const materializedViewKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'materializedViews'] as const,
  listBySchema: (projectRef: string | undefined, schema: string) =>
    [...materializedViewKeys.list(projectRef), schema] as const,
  materializedView: (projectRef: string | undefined, id: number | undefined) =>
    ['projects', projectRef, 'materializedViews', id] as const,
}
