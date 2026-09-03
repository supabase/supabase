import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

import { env } from '../env'
import { HttpError } from '../http/errors'

export type PlatformIdentity = {
  sub: string
  email?: string
}

type PlatformJwtPayload = JWTPayload & {
  email?: string
  user_metadata?: { email?: string }
}

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(env.platformJwksUrl))
  }
  return jwks
}

function emailFromPayload(payload: PlatformJwtPayload): string | undefined {
  if (typeof payload.email === 'string' && payload.email.length > 0) {
    return payload.email
  }
  const nested = payload.user_metadata?.email
  if (typeof nested === 'string' && nested.length > 0) {
    return nested
  }
  return undefined
}

export async function verifyPlatformJwt(token: string): Promise<PlatformIdentity> {
  try {
    const issuer = env.platformJwtIssuer
    const { payload } = await jwtVerify(token, getJwks(), {
      ...(issuer ? { issuer } : {}),
    })

    const sub = payload.sub
    if (!sub) {
      throw new HttpError(401, 'unauthorized', 'Platform token is missing sub.')
    }

    return { sub, email: emailFromPayload(payload as PlatformJwtPayload) }
  } catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(401, 'unauthorized', 'Invalid platform token.')
  }
}
