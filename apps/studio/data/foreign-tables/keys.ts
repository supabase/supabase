export const foreignTableKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'foreignTables'] as const,
  listBySchema: (projectRef: string | undefined, schema: string) =>
    [...foreignTableKeys.list(projectRef), schema] as const,
  foreignTable: (projectRef: string | undefined, id: number | undefined) =>
    ['projects', projectRef, 'foreignTables', id] as const,
}
