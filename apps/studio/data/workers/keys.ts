export const workersKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'workers'] as const,
  detail: (projectRef: string | undefined, name: string | undefined) =>
    ['projects', projectRef, 'worker', name, 'detail'] as const,
  logs: (
    projectRef: string | undefined,
    name: string | undefined,
    stream: string,
    filters: {
      iso_timestamp_start?: string
      iso_timestamp_end?: string
      message?: string
      method?: string
    }
  ) => ['projects', projectRef, 'worker', name, 'logs', stream, filters] as const,
}
