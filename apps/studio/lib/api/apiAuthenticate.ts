import type { JwtPayload } from '@supabase/supabase-js'

import { getUserClaims } from '@/lib/gotrue'

/**
 * Authenticate an incoming Web Request using its Authorization header.
 * This method can only be used from the server side.
 */
export async function authenticateRequest(
  request: Request
): Promise<JwtPayload | { error: Error }> {
  const token = request.headers.get('authorization')?.replace(/bearer /i, '')
  if (!token) return { error: new Error('missing access token') }

  const { claims, error } = await getUserClaims(token)
  if (error) return { error }
  if (!claims) return { error: new Error('The user does not exist') }

  return claims
}
