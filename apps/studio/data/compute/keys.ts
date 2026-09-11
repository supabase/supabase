export const computeKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'compute'] as const,
  detail: (projectRef: string | undefined, name: string | undefined) =>
    ['projects', projectRef, 'instance', name, 'detail'] as const,
  logs: (
    projectRef: string | undefined,
    name: string | undefined,
    stream: string,
    filters: {
      iso_timestamp_start?: string
      iso_timestamp_end?: string
      message?: string
    }
  ) => ['projects', projectRef, 'instance', name, 'logs', stream, filters] as const,
}
