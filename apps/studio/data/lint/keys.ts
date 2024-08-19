export const lintKeys = {
  lint: (projectRef: string | undefined) => ['projects', projectRef, 'lint'] as const,
}
