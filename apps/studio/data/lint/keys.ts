export const lintKeys = {
  lint: (projectRef: string | undefined) => ['projects', projectRef, 'lint'] as const,
  serviceRoleKeyLeak: (projectRef: string | undefined) =>
    ['projects', projectRef, 'service-role-key-leak'] as const,
}
