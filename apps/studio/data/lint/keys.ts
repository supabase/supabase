export const lintKeys = {
  lint: (projectRef: string | undefined) => ['projects', projectRef, 'lint'] as const,
  lintRules: (projectRef: string | undefined) => ['projects', projectRef, 'lint-rules'] as const,
}
