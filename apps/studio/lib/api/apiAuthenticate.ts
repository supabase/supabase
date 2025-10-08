import type { JwtPayload } from '@supabase/supabase-js'
import { getUserClaims } from 'lib/gotrue'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { ResponseError } from 'types'

/**
 * Use this method on api routes to check if user is authenticated and having required permissions.
 * This method can only be used from the server side.
 * Member permission is mandatory whenever orgSlug/projectRef query param exists
 * @param {NextApiRequest}    req
 * @param {NextApiResponse}   _res
 *
 * @returns {Object<user, error, description>}
 *   user null, with error and description if not authenticated or not enough permissions
 */
export async function apiAuthenticate(
  req: NextApiRequest,
  _res: NextApiResponse
): Promise<JwtPayload | { error: ResponseError }> {
  try {
    const claims = await fetchUserClaims(req)
    if (!claims) {
      return { error: new Error('The user does not exist') }
    }

    return claims
  } catch (error) {
    return { error: error as ResponseError }
  }
}

/**
 * @returns
 *  user with only id prop or detail object. It depends on requireUserDetail config
 */
async function fetchUserClaims(req: NextApiRequest): Promise<JwtPayload> {
  const token = req.headers.authorization?.replace(/bearer /i, '')
  if (!token) {
    throw new Error('missing access token')
  }
  const { claims, error } = await getUserClaims(token)
  if (error) {
    throw error
  }

  if (!claims) {
    throw new Error('The user does not exist')
  }

  return claims
}
