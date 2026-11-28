import * as Sentry from '@sentry/react'
import type { JwtPayload } from '@supabase/supabase-js'

import { IS_PLATFORM } from '../constants'
import { authenticateRequest } from './apiAuthenticate'
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
 * malformed-JSON 400 handling, Sentry error reporting, and 405 Method Not Allowed (with an
 * `Allow` header derived from the registered methods) for any other method, via `ANY` and
 * for a HEAD request dispatched to a GET-only handler.
 */
export function createApiHandlers<M extends ApiMethod>(
  handlers: Record<M, ApiHandler>,
  options?: { withAuth?: boolean }
): Record<M | 'ANY', ServerRouteHandler> {
  const allowedMethods = Object.keys(handlers) as M[]
  const wrapped = {} as Record<M | 'ANY', ServerRouteHandler>

  const methodNotAllowed = (request: Request) =>
    Response.json(
      { data: null, error: { message: `Method ${request.method} Not Allowed` } },
      { status: 405, headers: { Allow: allowedMethods.join(', ') } }
    )

  for (const method of allowedMethods) {
    const handler = handlers[method]
    wrapped[method] = async ({ request, params = {} }) => {
      // TanStack Start dispatches HEAD to GET when no HEAD handler is registered.
      if (request.method !== method) return methodNotAllowed(request)

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

  wrapped.ANY = async ({ request }) => methodNotAllowed(request)

  return wrapped
}
