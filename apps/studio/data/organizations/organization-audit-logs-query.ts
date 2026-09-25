import { useQuery } from '@tanstack/react-query'

import { organizationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

// Audit log timestamps are returned in microseconds, not milliseconds.
// Divide by this constant before passing to dayjs/Date to get a valid date.
export const TIMESTAMP_MICROS_PER_MS = 1000

export type AuditLog = {
  organization_slug?: string
  project_ref?: string
  request_id: string
  action: {
    name: string
    method: string
    route: string
    status: number
    metadata?: Record<string, unknown>
  }
  actor: {
    token_type: string
    token_hash?: string
    user_id?: string
    email?: string
    oauth_app_id?: string
    oauth_app_name?: string
    app_id?: string
    app_name?: string
    ip?: string
    partner?: string
    partner_installation_id?: string
    partner_user_email?: string
    partner_user_id?: string
  }
  timestamp: number
}

export type OrganizationAuditLogsResponse = {
  result: AuditLog[]
  retention_period: number
}

export type OrganizationAuditLogsVariables = {
  slug?: string
  iso_timestamp_start: string
  iso_timestamp_end: string
}

// TODO: remove - temporary mock data for local UI testing
const MOCK_ACTIONS: Array<Pick<AuditLog['action'], 'name' | 'method' | 'route' | 'status'>> = [
  {
    name: 'organization.member.invite',
    method: 'POST',
    route: '/platform/organizations/{slug}/members/invite',
    status: 200,
  },
  {
    name: 'organization.member.remove',
    method: 'DELETE',
    route: '/platform/organizations/{slug}/members/{id}',
    status: 200,
  },
  {
    name: 'project.database.query',
    method: 'POST',
    route: '/platform/pg-meta/{ref}/query',
    status: 200,
  },
  {
    name: 'project.function.deploy',
    method: 'PUT',
    route: '/platform/projects/{ref}/functions/{slug}',
    status: 500,
  },
  {
    name: 'project.database.backup.restore',
    method: 'POST',
    route: '/platform/database/{ref}/backups/restore',
    status: 200,
  },
  {
    name: 'organization.billing.update',
    method: 'PATCH',
    route: '/platform/organizations/{slug}/billing/subscription',
    status: 200,
  },
  {
    name: 'project.api-keys.create',
    method: 'POST',
    route: '/platform/projects/{ref}/api-keys',
    status: 201,
  },
  {
    name: 'project.settings.update',
    method: 'PATCH',
    route: '/platform/projects/{ref}/settings',
    status: 400,
  },
  {
    name: 'organization.role.update',
    method: 'PATCH',
    route: '/platform/organizations/{slug}/members/{id}/roles',
    status: 200,
  },
  {
    name: 'project.delete',
    method: 'DELETE',
    route: '/platform/projects/{ref}',
    status: 200,
  },
]

const MOCK_USERS = [
  { user_id: '4d96a28f-64ac-4546-9578-78250185c606', email: 'joshenlimek@gmail.com', ip: '1.2.3.4' },
  { user_id: 'b7d478cf-eb8c-4c28-9c41-a5df3f782486', email: 'joshen@supabase.io', ip: '5.6.7.8' },
  {
    user_id: 'f353ca57-e2af-4ba5-99cd-16df8b8601a6',
    email: 'joshen+test@supabase.io',
    ip: '10.10.10.10',
  },
]

const MOCK_PROJECT_REFS = [
  'iuyhipowqswtlfwwallh', // 070926
  'vaadeouujtczmmxeoqkc', // 220626
  'vdpphnpaukzpklblqzcm', // MG 03
  'zrfkwwocfdqhgvtdasbt', // Multigres
  'msncgjrpyaizgizcgtsl', // Project down
]

const MOCK_ACTORS: AuditLog['actor'][] = [
  ...MOCK_USERS.map((user) => ({ token_type: 'oauth', ...user })),
  ...MOCK_USERS.map((user) => ({
    token_type: 'personal_access_token',
    token_hash: 'sbp_mock_hash',
    ...user,
  })),
  { token_type: 'oauth_app', oauth_app_id: 'mock-app-1', oauth_app_name: 'Vercel' },
  { token_type: 'oauth_app', oauth_app_id: 'mock-app-2', oauth_app_name: 'GitHub' },
  {
    token_type: 'partner',
    partner: 'aws',
    partner_installation_id: 'mock-installation-1',
    partner_user_email: 'partner-user@example.com',
    partner_user_id: 'mock-partner-user-1',
  },
]

function getMockOrganizationAuditLogs(slug: string): OrganizationAuditLogsResponse {
  const now = Date.now() * TIMESTAMP_MICROS_PER_MS
  const hourInMicros = 60 * 60 * 1000 * TIMESTAMP_MICROS_PER_MS

  const result: AuditLog[] = Array.from({ length: 50 }, (_, i) => {
    const action = MOCK_ACTIONS[i % MOCK_ACTIONS.length]
    const actor = MOCK_ACTORS[i % MOCK_ACTORS.length]
    const isProjectScoped = i % 3 !== 0

    return {
      organization_slug: isProjectScoped ? undefined : slug,
      project_ref: isProjectScoped ? MOCK_PROJECT_REFS[i % MOCK_PROJECT_REFS.length] : undefined,
      request_id: `mock-request-${i + 1}`,
      action,
      actor,
      timestamp: now - i * 1.5 * hourInMicros,
    }
  })

  return { result, retention_period: 62 }
}

export async function getOrganizationAuditLogs(
  { slug, iso_timestamp_start, iso_timestamp_end }: OrganizationAuditLogsVariables,
  signal?: AbortSignal
) {
  if (!slug) throw new Error('slug is required')

  // TODO: remove - temporary mock data for local UI testing
  return getMockOrganizationAuditLogs(slug)

  // Real implementation, restore this and delete the two lines above when done testing:
  // const { data, error } = await get('/platform/organizations/{slug}/audit', {
  //   params: { path: { slug }, query: { iso_timestamp_start, iso_timestamp_end } },
  //   signal,
  // })
  // if (error) handleError(error)
  // // [Joshen] API doesn't generate types for each audit log properly
  // return data as unknown as OrganizationAuditLogsResponse
}

export type OrganizationAuditLogsData = Awaited<ReturnType<typeof getOrganizationAuditLogs>>
export type OrganizationAuditLogsError = ResponseError

export const useOrganizationAuditLogsQuery = <TData = OrganizationAuditLogsData>(
  vars: OrganizationAuditLogsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OrganizationAuditLogsData, OrganizationAuditLogsError, TData> = {}
) => {
  const { slug, iso_timestamp_start, iso_timestamp_end } = vars

  return useQuery<OrganizationAuditLogsData, OrganizationAuditLogsError, TData>({
    queryKey: organizationKeys.auditLogs(slug, {
      date_start: iso_timestamp_start,
      date_end: iso_timestamp_end,
    }),
    queryFn: ({ signal }) => getOrganizationAuditLogs(vars, signal),
    enabled: enabled && typeof slug !== 'undefined',
    ...options,
  })
}
