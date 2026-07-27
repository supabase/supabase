export const foreignTableKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'foreignTables'] as const,
  listBySchema: (projectRef: string | undefined, schemas?: string[]) =>
    [...foreignTableKeys.list(projectRef), schemas].filter(Boolean),
}
