import { env } from '../env'
import { HttpError } from '../http/errors'
import { assistantPolicySchema } from '../permissions'

export async function getPlatformPolicy(
  token: string,
  context: { projectRef?: string; orgSlug?: string } = {},
  signal?: AbortSignal
) {
  const response = await fetch(env.policyUrl, {
    method: 'POST',
    redirect: 'error',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(context),
    signal: AbortSignal.any([AbortSignal.timeout(15_000), ...(signal ? [signal] : [])]),
  })
  if (!response.ok) {
    throw new HttpError(
      response.status === 401 ? 401 : 403,
      'unauthorized',
      'Assistant access could not be verified. Sign in again or try later.'
    )
  }
  const policy = assistantPolicySchema.parse(await response.json())
  if (
    context.projectRef &&
    (policy.projectRef !== context.projectRef || policy.orgSlug !== context.orgSlug)
  ) {
    throw new HttpError(403, 'unauthorized', 'You do not have access to this project.')
  }
  return policy
}
