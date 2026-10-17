export const lintKeys = {
  lint: (projectRef: string | undefined) => ['projects', projectRef, 'lint'] as const,
  healthLints: (projectRef: string | undefined) =>
    ['projects', projectRef, 'lint', 'health'] as const,
  lintRules: (projectRef: string | undefined) => ['projects', projectRef, 'lint-rules'] as const,
}
