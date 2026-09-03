import { withNone, withUser, type AuthedHandler, type HandlerContext } from './auth'
import { corsHeaders } from './cors'
import { jsonError, toErrorResponse } from './errors'
import type { Route } from './route-types'

export type { Route } from './route-types'

type CompiledPattern = {
  match(pathname: string): Record<string, string> | null
}

function compile(pattern: string): CompiledPattern {
  const parts = pattern.split('/').filter((part, index) => !(index === 0 && part === ''))
  const absolute = pattern.startsWith('/')

  return {
    match(pathname: string) {
      const pathParts = pathname.split('/').filter((part, index) => !(index === 0 && part === ''))
      if (absolute !== pathname.startsWith('/')) return null
      if (pathParts.length !== parts.length) return null

      const params: Record<string, string> = {}
      for (let i = 0; i < parts.length; i++) {
        const expected = parts[i]
        const actual = pathParts[i]
        if (expected === undefined || actual === undefined) return null
        if (expected.startsWith(':')) {
          params[expected.slice(1)] = decodeURIComponent(actual)
          continue
        }
        if (expected !== actual) return null
      }
      return params
    },
  }
}

function wrap(route: Route, pattern: CompiledPattern): (request: Request) => Promise<Response> {
  const inner: AuthedHandler = async (req, ctx) => {
    try {
      const params = pattern.match(new URL(req.url).pathname) ?? {}
      return await route.handler(req, ctx, params)
    } catch (error) {
      return toErrorResponse(error)
    }
  }
  return route.auth === 'user' ? withUser(inner) : withNone(inner)
}

export function createRouter(routes: Route[]) {
  const compiled = routes.map((route) => {
    const pattern = compile(route.pattern)
    return {
      route,
      pattern,
      fetch: wrap(route, pattern),
    }
  })

  return async function handleRequest(request: Request): Promise<Response> {
    const { pathname } = new URL(request.url)
    const pathMatches = compiled.filter((entry) => entry.pattern.match(pathname) !== null)

    if (request.method === 'OPTIONS') {
      if (pathMatches.length > 0) {
        return pathMatches[0].fetch(request)
      }
      return new Response(null, { status: 204, headers: corsHeaders(request) })
    }

    const methodMatch = pathMatches.find((entry) => entry.route.method === request.method)
    if (methodMatch) {
      return methodMatch.fetch(request)
    }

    if (pathMatches.length > 0) {
      return jsonError(405, 'invalid_request', 'Method not allowed')
    }

    return jsonError(404, 'not_found', 'Not found')
  }
}

export type { HandlerContext }
