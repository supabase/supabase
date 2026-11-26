import * as Sentry from '@sentry/react'
import type { JwtPayload } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

import { IS_PLATFORM } from '../constants'
import { apiAuthenticate, authenticateRequest } from './apiAuthenticate'
import { InvalidJsonError } from './apiHelpers'
import { isStudioError } from '@/lib/errors/studio-errors'
import type { ResponseFailure } from '@/types'

type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export interface ApiHandlerContext {
  request: Request
  params: Record<string, string>
  claims?: JwtPayload
}

export type ApiHandler = (ctx: ApiHandlerContext) => Response | Promise<Response>

type ServerRouteHandler = (ctx: {
  request: Request
  params?: Record<string, string>
}) => Promise<Response>

export function isResponseOk<T>(response: T | ResponseFailure | undefined): response is T {
  if (response === undefined || response === null) {
    return false
  }

  if (isStudioError(response)) {
    return false
  }

  if (typeof response === 'object' && 'error' in response && Boolean(response.error)) {
    return false
  }

  return true
}

/**
 * Wrap native TanStack Start API route handlers with optional platform JWT authentication,
 * malformed-JSON 400 handling, Sentry error reporting, and an `ANY` fallback that returns
 * 405 Method Not Allowed with an `Allow` header derived from the registered methods.
 */
export function createApiHandlers<M extends ApiMethod>(
  handlers: Record<M, ApiHandler>,
  options?: { withAuth?: boolean }
): Record<M | 'ANY', ServerRouteHandler> {
  const allowedMethods = Object.keys(handlers) as M[]
  const wrapped = {} as Record<M | 'ANY', ServerRouteHandler>

  for (const method of allowedMethods) {
    const handler = handlers[method]
    wrapped[method] = async ({ request, params = {} }) => {
      try {
        let claims: JwtPayload | undefined

        if (IS_PLATFORM && options?.withAuth) {
          const authResult = await authenticateRequest(request)
          if (!isResponseOk(authResult)) {
            return Response.json(
              { error: { message: `Unauthorized: ${authResult.error.message}` } },
              { status: 401 }
            )
          }
          claims = authResult
        }

        return await handler({ request, params, claims })
      } catch (error) {
        if (error instanceof InvalidJsonError) {
          return new Response('Invalid JSON', { status: 400, statusText: 'Invalid JSON' })
        }
        Sentry.captureException(error)
        return Response.json({ error: { message: 'Internal Server Error' } }, { status: 500 })
      }
    }
  }

  wrapped.ANY = async ({ request }) =>
    Response.json(
      { data: null, error: { message: `Method ${request.method} Not Allowed` } },
      { status: 405, headers: { Allow: allowedMethods.join(', ') } }
    )

  return wrapped
}

// Purpose of this apiWrapper is to function like a global catchall for ANY errors
// It's a safety net as the API service should never drop, nor fail

export async function apiWrapper(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (
    req: NextApiRequest,
    res: NextApiResponse,
    claims?: JwtPayload
  ) => Promise<NextApiResponse | Response | void>,
  options?: { withAuth: boolean }
): Promise<NextApiResponse | Response | void> {
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

    return await handler(req, res, claims)
  } catch (error) {
    Sentry.captureException(error)
    return res.status(500).json({ error })
  }
}
