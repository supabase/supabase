import type { OAuthApproval } from '@/data/oauth-apps/oauth-apps-approvals-query'

export type OAuthAppDatabaseAccess = {
  mode: 'Read only' | 'Read and write'
  role: string
  projects: string[] | null
}

const previewApps: { name: string; databaseAccess?: OAuthAppDatabaseAccess }[] = [
  {
    name: 'Example Partner',
    databaseAccess: {
      mode: 'Read and write',
      role: 'example_partner_user',
      projects: ['northwind-cms', 'northwind-storefront'],
    },
  },
  {
    name: 'Example Analytics',
    databaseAccess: { mode: 'Read only', role: 'example_analytics_user', projects: null },
  },
  { name: 'Example Deploy' },
]

export const authorizedAppsPreview: {
  approval: OAuthApproval
  databaseAccess?: OAuthAppDatabaseAccess
}[] = previewApps.map(({ name, databaseAccess }, index) => ({
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
  databaseAccess,
}))
