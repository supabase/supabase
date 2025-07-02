export const mergeRequestKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'merge-requests'] as const,
  detail: (projectRef: string | undefined, id: string | undefined) =>
    ['projects', projectRef, 'merge-requests', id] as const,
}
