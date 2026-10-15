// TEMPORARY: local mock data for the account audit logs page. Do not commit.
import { get } from '@/data/fetchers'
import type { AuditLog } from '@/data/organizations/organization-audit-logs-query'
import { getOrganizations } from '@/data/organizations/organizations-query'

const ACTIONS = [
  { name: 'Create project', method: 'POST', route: '/platform/projects', status: 201 },
  { name: 'Update project settings', method: 'PATCH', route: '/platform/projects/{ref}', status: 200 },
  { name: 'Pause project', method: 'POST', route: '/platform/projects/{ref}/pause', status: 200 },
  { name: 'Delete project', method: 'DELETE', route: '/platform/projects/{ref}', status: 200 },
  { name: 'Create API key', method: 'POST', route: '/v1/projects/{ref}/api-keys', status: 201 },
  { name: 'Invite member', method: 'POST', route: '/platform/organizations/{slug}/members/invite', status: 201 },
  { name: 'Update member role', method: 'PATCH', route: '/platform/organizations/{slug}/members/{gotrue_id}', status: 200 },
  { name: 'Update billing address', method: 'PUT', route: '/platform/organizations/{slug}/billing/address', status: 400 },
  { name: 'Create access token', method: 'POST', route: '/platform/profile/access-tokens', status: 201 },
  { name: 'Delete access token', method: 'DELETE', route: '/platform/profile/access-tokens/{id}', status: 403 },
]

const IPS = ['203.0.113.42', '198.51.100.7', '192.0.2.18', '2001:db8::1']

export const generateMockAuditLogs = ({
  projectRefs,
  orgSlugs,
  count = 2000,
  days = 7,
}: {
  projectRefs: string[]
  orgSlugs: string[]
  count?: number
  days?: number
}): AuditLog[] => {
  const now = Date.now()
  return Array.from({ length: count }, (_, i) => {
    const action = ACTIONS[i % ACTIONS.length]
    const isOrgScoped = action.route.includes('{slug}')
    const isTokenActor = i % 7 === 0
    const ts = now - Math.floor(((i + 1) / count) * days * 24 * 60 * 60 * 1000)
    return {
      action: { ...action, metadata: [{ mock: true }] as any, params: { index: i } },
      actor: {
        email: 'joshen@supabase.io',
        user_id: 'mock-user-id',
        ip: IPS[i % IPS.length],
        token_type: isTokenActor ? 'v1' : 'jwt',
        token_alias: isTokenActor ? 'ci-token' : null,
        session_id: isTokenActor ? null : 'mock-session-id',
      },
      organization_slug: isOrgScoped && orgSlugs.length ? orgSlugs[i % orgSlugs.length] : null,
      project_ref:
        action.route.includes('{ref}') && projectRefs.length ? projectRefs[i % projectRefs.length] : null,
      request_id: `mock-request-${i}`,
      // API returns microseconds
      timestamp: ts * 1000,
    }
  })
}

// Pulls real project refs / org slugs so the project and org columns resolve to names
export const getMockProfileAuditLogs = async (signal?: AbortSignal) => {
  const [orgs, projectsRes] = await Promise.all([
    getOrganizations({ signal }),
    get('/platform/projects', {
      // @ts-ignore API type issue for Version 2 endpoints
      params: { query: { limit: 50, offset: 0 } },
      signal,
      headers: { Version: '2' },
    }),
  ])
  const projects = (projectsRes.data as any)?.projects ?? []
  return {
    result: generateMockAuditLogs({
      projectRefs: projects.map((p: { ref: string }) => p.ref),
      orgSlugs: orgs.map((o) => o.slug),
    }),
    retention_period: 7,
  }
}
