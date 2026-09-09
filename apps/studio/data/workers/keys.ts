export const workersKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'workers'] as const,
  detail: (projectRef: string | undefined, name: string | undefined) =>
    ['projects', projectRef, 'worker', name, 'detail'] as const,
}
