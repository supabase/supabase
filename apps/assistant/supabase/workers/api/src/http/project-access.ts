import { getValidAccessToken } from '../db/oauth-connections'
import { getProjectPolicy } from '../platform/policy'
import { HttpError } from './errors'

/** Resolve project access from the caller's connection, independently of the calling surface. */
export async function requireProjectAccess(
  userId: string,
  projectRef: string,
  orgSlug: string,
  signal?: AbortSignal
) {
  const oauthToken = await getValidAccessToken(userId, orgSlug)
  if (!oauthToken)
    throw new HttpError(409, 'oauth_required', 'Connect this organization to continue.', {
      org_slug: orgSlug,
    })
  const policy = await getProjectPolicy(oauthToken, { projectRef, orgSlug }, signal)
  return { ...policy, oauthToken }
}
