export const secretsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'secrets'] as const,
}
