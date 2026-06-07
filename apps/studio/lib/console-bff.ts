/**
 * [console fork] BFF helpers.
 *
 * The dashboard's `data/` layer calls `/platform/*` (typed by api-types). Those
 * Next API routes (under `pages/api/platform/*`) act as a Backend-For-Frontend:
 * they forward the browser's better-auth session cookie to our control-plane
 * (`CONSOLE_API_URL`) and translate our `/api/v1` + better-auth responses into the
 * shapes the dashboard expects. Browser <-> BFF is same-origin; BFF <-> backend is
 * server-side with the cookie forwarded.
 */
import type { NextApiRequest, NextApiResponse } from 'next'

export const CONSOLE_API_URL = process.env.CONSOLE_API_URL ?? 'http://localhost:3000'

// Origin the backend trusts (better-auth trustedOrigins). The dashboard origin.
const DASHBOARD_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:8082'

function buildHeaders(req: NextApiRequest, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Origin: DASHBOARD_ORIGIN,
    ...extra,
  }
  if (req.headers.cookie) headers.Cookie = req.headers.cookie
  return headers
}

/** Call the control-plane, forwarding the session cookie. Returns parsed JSON + status. */
export async function consoleFetch<T = any>(
  req: NextApiRequest,
  path: string,
  init?: RequestInit
): Promise<{ status: number; ok: boolean; data: T | null }> {
  const res = await fetch(`${CONSOLE_API_URL}${path}`, {
    ...init,
    headers: buildHeaders(req, init?.headers as Record<string, string> | undefined),
  })
  const text = await res.text()
  let data: T | null = null
  try {
    data = text ? (JSON.parse(text) as T) : null
  } catch {
    data = null
  }
  return { status: res.status, ok: res.ok, data }
}

/** GET helper. */
export const consoleGet = <T = any>(req: NextApiRequest, path: string) =>
  consoleFetch<T>(req, path, { method: 'GET' })

/** Wrap a handler with method routing + a 500 guard, mirroring studio's apiWrapper style. */
export function bff(
  handlers: Partial<
    Record<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', (req: NextApiRequest, res: NextApiResponse) => Promise<void> | void>
  >
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const method = (req.method ?? 'GET') as keyof typeof handlers
    const handler = handlers[method]
    if (!handler) {
      res.setHeader('Allow', Object.keys(handlers))
      return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
    }
    try {
      await handler(req, res)
    } catch (err: any) {
      res.status(500).json({ error: { message: err?.message ?? 'BFF error' } })
    }
  }
}

/* ----------------------------- shape mappers ----------------------------- */

export type BackendOrg = {
  id: string
  name: string
  slug: string
  createdAt?: string
  type?: string
  dataPrivacyLevel?: string
  mfaRequired?: boolean
}

/** better-auth org -> dashboard OrganizationResponse shape. */
export function mapOrganization(org: BackendOrg, billingEmail: string) {
  return {
    // dashboard routes by slug; keep our string id alongside.
    id: org.id,
    slug: org.slug,
    name: org.name,
    billing_email: billingEmail,
    // No billing in this product: report a single non-gated plan everywhere.
    plan: { id: 'enterprise', name: 'Enterprise' },
    // surface our custom fields for settings screens
    organization_requires_mfa: !!org.mfaRequired,
    restriction_status: null,
    restriction_data: {},
    created_at: org.createdAt,
  }
}

// Map our control-plane project status -> dashboard project status enum.
const PROJECT_STATUS_MAP: Record<string, string> = {
  provisioning: 'COMING_UP',
  active: 'ACTIVE_HEALTHY',
  ACTIVE_HEALTHY: 'ACTIVE_HEALTHY',
  failed: 'INIT_FAILED',
  paused: 'INACTIVE',
  pausing: 'PAUSING',
  resuming: 'RESTORING',
  removed: 'REMOVED',
}
export function mapProjectStatus(status?: string) {
  return (status && PROJECT_STATUS_MAP[status]) || 'UNKNOWN'
}

/** Resolve an org slug -> our backend org (with string id). */
export async function resolveOrg(req: import('next').NextApiRequest, slug: string) {
  const { data: orgs } = await consoleGet<BackendOrg[]>(req, '/api/auth/organization/list')
  return (Array.isArray(orgs) ? orgs : []).find((o) => o.slug === slug) ?? null
}

/**
 * Resolve a project's running data-plane endpoint: its kong base URL +
 * service_role key, so the BFF can proxy pg-meta / data-plane calls to the
 * per-project containers.
 */
export async function getProjectDataPlane(
  req: import('next').NextApiRequest,
  ref: string
): Promise<{ baseUrl: string; serviceKey: string } | null> {
  const [{ data: project }, { data: keys }] = await Promise.all([
    consoleGet<any>(req, `/api/v1/projects/${ref}`),
    consoleGet<{ serviceRoleKey?: string }>(req, `/api/v1/projects/${ref}/api-keys`),
  ])
  const port = project?.connection?.kongHttpPort ?? project?.kongHttpPort
  const host = project?.connection?.host ?? 'localhost'
  if (!port || !keys?.serviceRoleKey) return null
  return { baseUrl: `http://${host}:${port}`, serviceKey: keys.serviceRoleKey }
}

/**
 * A supabase-js client bound to a project's running data plane (kong + service
 * role key), for Auth-admin and Storage BFF endpoints. Returns null if the
 * project isn't running.
 */
export async function getProjectClient(req: import('next').NextApiRequest, ref: string) {
  const dp = await getProjectDataPlane(req, ref)
  if (!dp) return null
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createClient } = require('@supabase/supabase-js')
  return createClient(dp.baseUrl, dp.serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** better-auth get-full-organization (members + invitations) by slug. */
export async function getFullOrg(req: import('next').NextApiRequest, slug: string) {
  const { data } = await consoleGet<any>(
    req,
    `/api/auth/organization/get-full-organization?organizationSlug=${encodeURIComponent(slug)}`
  )
  return data
}

// Our org roles mapped to stable numeric ids the dashboard's member rows reference.
export const ROLE_NAME_TO_ID: Record<string, number> = { owner: 1, administrator: 2, developer: 3 }
export const ORG_ROLES = [
  { id: 1, name: 'Owner', description: 'Full access including org deletion', base_role_id: null, projects: [] },
  { id: 2, name: 'Administrator', description: 'Manage projects and members', base_role_id: null, projects: [] },
  { id: 3, name: 'Developer', description: 'Work within projects', base_role_id: null, projects: [] },
]

/** A wildcard permission granting the member everything within an org. */
export function wildcardPermission(organizationSlug: string) {
  return {
    actions: ['%'],
    resources: ['%'],
    condition: null,
    organization_slug: organizationSlug,
    project_refs: [] as string[],
    restrictive: false,
  }
}
