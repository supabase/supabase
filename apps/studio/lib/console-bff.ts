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
