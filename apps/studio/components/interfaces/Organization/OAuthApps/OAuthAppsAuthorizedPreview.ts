import type { OAuthApproval } from '@/data/oauth-apps/oauth-apps-approvals-query'

export type OAuthAppDatabaseAccess = {
  mode: 'Read only' | 'Read and write'
  role: string
}

export type PreviewGrant = {
  id: string
  member?: string
  projects?: { name: string; ref: string }[]
  scopes: string[]
  databaseAccess?: OAuthAppDatabaseAccess
}

const previewApps: {
  grants?: PreviewGrant[]
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
  {
    name: 'Example Single Member',
    scopes: [],
    grants: [
      {
        id: 'single-member',
        member: 'developer@example.com',
        scopes: ['projects:read'],
        projects: [{ name: 'northwind-cms', ref: 'wloepwuugddbnlnsakjc' }],
      },
    ],
  },
  {
    name: 'Example Members',
    scopes: [],
    grants: [
      {
        id: 'admin',
        member: 'admin@example.com',
        projects: [
          { name: 'northwind-cms', ref: 'wloepwuugddbnlnsakjc' },
          { name: 'northwind-storefront', ref: 'mxfnpqbrtuvhsgkzjdal' },
        ],
        scopes: ['database:read', 'database:write', 'projects:read'],
      },
      {
        id: 'developer',
        member: 'developer@example.com',
        projects: [{ name: 'northwind-cms', ref: 'wloepwuugddbnlnsakjc' }],
        scopes: ['projects:read'],
      },
      {
        id: 'developer1',
        member: 'developer1@example.com',
        projects: [{ name: 'northwind-storefront', ref: 'mxfnpqbrtuvhsgkzjdal' }],
        scopes: ['analytics:read'],
      },
      { id: 'developer2', member: 'developer2@example.com', scopes: ['projects:read'] },
    ],
  },
  {
    name: 'Example Mixed',
    scopes: [],
    grants: [
      {
        id: 'organization',
        projects: [{ name: 'northwind-cms', ref: 'wloepwuugddbnlnsakjc' }],
        scopes: ['projects:read'],
        databaseAccess: { mode: 'Read only', role: 'example_mixed_user' },
      },
      { id: 'member', member: 'admin@example.com', scopes: ['database:read', 'database:write'] },
    ],
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
  grants?: PreviewGrant[]
  approval: OAuthApproval
  projects?: { name: string; ref: string }[]
  scopes: string[]
  databaseAccess?: OAuthAppDatabaseAccess
}[] = previewApps.map(({ name, projects, scopes, databaseAccess, grants }, index) => ({
  approval: {
    id: `preview-app-${index + 1}`,
    type: 'oauth_app',
    attributes: {
      app: { name, icon: null, created_by: null },
      last_approved_at: '2026-11-01T00:00:00Z',
      target: grants
        ? grants.some((grant) => !grant.member)
          ? 'organization_and_members'
          : 'members'
        : 'organization',
      org_grant: null,
    },
  },
  grants,
  projects,
  scopes,
  databaseAccess,
}))
