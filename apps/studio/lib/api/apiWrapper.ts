import type { JwtPayload } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'
import { ResponseError, ResponseFailure } from 'types'

import { IS_PLATFORM } from '../constants'
import { apiAuthenticate } from './apiAuthenticate'

export function isResponseOk<T>(response: T | ResponseFailure | undefined): response is T {
  if (response === undefined || response === null) {
    return false
  }

  if (response instanceof ResponseError) {
    return false
  }

  if (typeof response === 'object' && 'error' in response && Boolean(response.error)) {
    return false
  }

  return true
}

// Purpose of this apiWrapper is to function like a global catchall for ANY errors
// It's a safety net as the API service should never drop, nor fail

export default async function apiWrapper(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    claims?: JwtPayload
  ) => Promise<Response | void>,
  options?: { withAuth: boolean }
): Promise<Response | void> {
  try {
    const { withAuth } = options || {}
    let claims: JwtPayload | undefined

    if (IS_PLATFORM && withAuth) {
      const response = await apiAuthenticate(req, res)
      if (!isResponseOk(response)) {
        return res.status(401).json({
          error: {
            message: `Unauthorized: ${response.error.message}`,
          },
        })
      }
      claims = response
    }

    return handler(req, res, claims)
  } catch (error) {
    return res.status(500).json({ error })
  }
}
