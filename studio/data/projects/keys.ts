export const projectKeys = {
  list: () => ['projects'] as const,
  detail: (projectRef: string | undefined) => ['projects', projectRef, 'detail'] as const,
  readonlyStatus: (projectRef: string | undefined) =>
    ['projects', projectRef, 'readonlyStatus'] as const,
}
