export const projectKeys = {
  list: () => ['projects'] as const,
  detail: (projectRef: string | undefined) => ['projects', projectRef] as const,
}
