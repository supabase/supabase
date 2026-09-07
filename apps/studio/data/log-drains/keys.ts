export const logDrainsKeys = {
  list: (projectRef: string | undefined) => ['projects', projectRef, 'log-drains'] as const,
  auditList: (slug: string | undefined) => ['organizations', slug, 'audit-log-drains'] as const,
}
