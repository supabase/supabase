import type { OAuthApproval } from '@/data/oauth-apps/oauth-apps-approvals-query'

export type OAuthAppDatabaseAccess = {
  mode: 'Read only' | 'Read and write'
  role: string
  projects: string[] | null
}

const previewApps: {
  name: string
  scopes: string[]
  databaseAccess?: OAuthAppDatabaseAccess
}[] = [
  {
    name: 'Example Partner',
    scopes: ['database:read', 'database:write', 'projects:read'],
    databaseAccess: {
      mode: 'Read and write',
      role: 'example_partner_user',
      projects: ['northwind-cms', 'northwind-storefront'],
    },
  },
  {
    name: 'Example Analytics',
    scopes: ['analytics:read', 'projects:read'],
    databaseAccess: { mode: 'Read only', role: 'example_analytics_user', projects: null },
  },
  { name: 'Example Deploy', scopes: ['projects:read', 'edge_functions:write'] },
]

export const authorizedAppsPreview: {
  approval: OAuthApproval
  scopes: string[]
  databaseAccess?: OAuthAppDatabaseAccess
}[] = previewApps.map(({ name, scopes, databaseAccess }, index) => ({
  approval: {
    id: `preview-app-${index + 1}`,
    type: 'oauth_app',
    attributes: {
      app: { name, icon: null, created_by: null },
      last_approved_at: '2026-11-01T00:00:00Z',
      target: 'organization',
      org_grant: null,
    },
  },
  scopes,
  databaseAccess,
}))
