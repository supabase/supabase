export const auditLogDrainsKeys = {
  list: (slug: string | undefined) => ['organizations', slug, 'audit-log-drains'] as const,
}
