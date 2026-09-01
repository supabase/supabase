export const workersKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'workers'] as const,
  detail: (projectRef: string | undefined, name: string | undefined) =>
    ['projects', projectRef, 'worker', name, 'detail'] as const,
  logs: (projectRef: string | undefined, name: string | undefined, stream: string) =>
    ['projects', projectRef, 'worker', name, 'logs', stream] as const,
}
