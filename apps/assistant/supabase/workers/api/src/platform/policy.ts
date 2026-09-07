import { z } from 'zod'

import { env } from '../env'
import { HttpError } from '../http/errors'

const projectSchema = z.object({
  ref: z.string().min(1),
  organization_slug: z.string().min(1),
})

const entitlementsSchema = z.object({
  entitlements: z.array(
    z.object({
      feature: z.object({ key: z.string() }),
      hasAccess: z.boolean(),
    })
  ),
})

async function getManagementResource(
  token: string,
  path: string,
  orgSlug: string,
  signal?: AbortSignal
) {
  const response = await fetch(`${env.managementApiUrl}${path}`, {
    redirect: 'error',
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    signal: AbortSignal.any([AbortSignal.timeout(15_000), ...(signal ? [signal] : [])]),
  })
  if (response.status === 401) {
    throw new HttpError(409, 'oauth_required', 'Reconnect Supabase to continue.', {
      org_slug: orgSlug,
    })
  }
  if (response.status === 403 || response.status === 404) {
    throw new HttpError(403, 'unauthorized', 'Assistant does not have access to this project.')
  }
  if (!response.ok) {
    throw new HttpError(502, 'internal', 'Unable to verify project access. Try again.')
  }
  return response.json()
}

/** Verify the connection's project access directly with the Management API. */
export async function getProjectPolicy(
  oauthToken: string,
  context: { projectRef: string; orgSlug: string },
  signal?: AbortSignal
) {
  if (!oauthToken) {
    throw new HttpError(409, 'oauth_required', 'Connect Supabase to continue.', {
      org_slug: context.orgSlug,
    })
  }
  const project = projectSchema.safeParse(
    await getManagementResource(
      oauthToken,
      `/v1/projects/${encodeURIComponent(context.projectRef)}`,
      context.orgSlug,
      signal
    )
  )
  if (
    !project.success ||
    project.data.ref !== context.projectRef ||
    project.data.organization_slug !== context.orgSlug
  ) {
    throw new HttpError(403, 'unauthorized', 'Assistant does not have access to this project.')
  }

  const entitlements = entitlementsSchema.safeParse(
    await getManagementResource(
      oauthToken,
      `/v1/organizations/${encodeURIComponent(project.data.organization_slug)}/entitlements`,
      project.data.organization_slug,
      signal
    )
  )
  if (!entitlements.success) {
    throw new HttpError(502, 'internal', 'Unable to verify model access. Try again.')
  }

  return {
    projectRef: project.data.ref,
    orgSlug: project.data.organization_slug,
    hasAccessToAdvanceModel: entitlements.data.entitlements.some(
      (entitlement) =>
        entitlement.feature.key === 'assistant.advance_model' && entitlement.hasAccess
    ),
  }
}
