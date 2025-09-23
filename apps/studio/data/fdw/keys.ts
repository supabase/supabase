export const fdwKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'fdws'] as const,
}
