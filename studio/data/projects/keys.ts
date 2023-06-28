export const projectKeys = {
  list: () => ['all-projects'] as const,
  detail: (projectRef: string | undefined) => ['project', projectRef, 'detail'] as const,
}
