export const ORG_SETTINGS_ROUTES: readonly string[] = [
  'general',
  'security',
  'sso',
  'apps',
  'private-apps',
  'webhooks',
  'audit',
  'audit-log-drains',
  'documents',
]

export function isOrgMenuScope(pathname: string): boolean {
  if (!pathname || typeof pathname !== 'string') return false
  const trimmed = pathname.trim()
  return trimmed.startsWith('/org/')
}
