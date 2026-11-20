import type { OAuthApproval } from '@/data/oauth-apps/oauth-apps-approvals-query'

export type OAuthAppDatabaseAccess = {
  mode: 'Read only' | 'Read and write'
  role: string
}

const previewApps: {
  name: string
  projects?: { name: string; ref: string }[]
  scopes: string[]
  databaseAccess?: OAuthAppDatabaseAccess
}[] = [
  {
    name: 'Example Partner',
    projects: [
      { name: 'northwind-cms', ref: 'wloepwuugddbnlnsakjc' },
      { name: 'northwind-storefront', ref: 'mxfnpqbrtuvhsgkzjdal' },
    ],
    scopes: ['database:read', 'database:write', 'projects:read'],
    databaseAccess: {
      mode: 'Read and write',
      role: 'example_partner_user',
    },
  },
  {
    name: 'Example Analytics',
    scopes: ['analytics:read', 'projects:read'],
    databaseAccess: { mode: 'Read only', role: 'example_analytics_user' },
  },
  { name: 'Example Empty', projects: [], scopes: [] },
  { name: 'Example All Projects', scopes: [] },
  {
    name: 'Example Deploy',
    projects: [{ name: 'northwind-cms', ref: 'wloepwuugddbnlnsakjc' }],
    scopes: ['database:write', 'projects:read'],
  },
]

export const authorizedAppsPreview: {
  approval: OAuthApproval
  projects?: { name: string; ref: string }[]
  scopes: string[]
  databaseAccess?: OAuthAppDatabaseAccess
}[] = previewApps.map(({ name, projects, scopes, databaseAccess }, index) => ({
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
  projects,
  scopes,
  databaseAccess,
}))
