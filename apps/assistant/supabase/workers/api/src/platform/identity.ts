import { decodeJwt } from 'jose'
import { z } from 'zod'

import { env } from '../env'
import { HttpError } from '../http/errors'

const userSchema = z.object({
  id: z.string().uuid(),
  factors: z.array(z.object({ status: z.enum(['unverified', 'verified']) })).optional(),
})

const claimsSchema = z.object({
  sub: z.string().uuid(),
  aud: z.literal('authenticated'),
  role: z.literal('authenticated'),
  exp: z.number().int(),
  aal: z.enum(['aal1', 'aal2']).optional(),
})

/**
 * Studio's sign-in adapter. The trusted platform Auth server verifies the token;
 * all later Assistant requests use the Assistant project's own session.
 */
export async function verifyPlatformIdentity(token: string, signal?: AbortSignal) {
  const response = await fetch(`${env.platformAuthUrl}/user`, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: 'error',
    signal: AbortSignal.any([AbortSignal.timeout(15_000), ...(signal ? [signal] : [])]),
  })
  if (!response.ok) {
    throw new HttpError(
      401,
      'unauthorized',
      'Your Supabase session could not be verified. Sign in again.'
    )
  }

  // Decode only after the Auth server has authenticated this exact token. Never
  // use its issuer or user metadata to choose the server or establish identity.
  let claims: z.infer<typeof claimsSchema>
  let user: z.infer<typeof userSchema>
  try {
    claims = claimsSchema.parse(decodeJwt(token))
    user = userSchema.parse(await response.json())
  } catch {
    throw new HttpError(
      401,
      'unauthorized',
      'Your Supabase session could not be verified. Sign in again.'
    )
  }
  if (user.id !== claims.sub || claims.exp <= Math.floor(Date.now() / 1000)) {
    throw new HttpError(
      401,
      'unauthorized',
      'Your Supabase session could not be verified. Sign in again.'
    )
  }
  if (user.factors?.some((factor) => factor.status === 'verified') && claims.aal !== 'aal2') {
    throw new HttpError(403, 'unauthorized', 'Complete two-factor authentication to continue.')
  }
  return { userId: user.id }
}
