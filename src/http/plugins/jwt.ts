import { verifyJWT, verifyJWTWithCache } from '@internal/auth'
import { getJwtSecret } from '@internal/database'
import { ERRORS } from '@internal/errors'
import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { JWTPayload } from 'jose'
import { getConfig } from '../../config'

declare module 'fastify' {
  interface FastifyRequest {
    isAuthenticated: boolean
    jwt: string
    jwtPayload?: JWTPayload & { role?: string }
    owner?: string
  }

  interface FastifyContextConfig {
    allowInvalidJwt?: boolean
  }
}

interface JWTPluginOptions {
  enforceJwtRoles?: string[]
  skipIfAlreadyAuthenticated?: boolean
}

const { jwtCachingEnabled } = getConfig()

const BEARER = /^Bearer\s+/i

const jwtPlugin = fastifyPlugin<JWTPluginOptions>(
  async (fastify, opts) => {
    fastify.decorateRequest('jwt', '')
    fastify.decorateRequest('jwtPayload', undefined)

    fastify.addHook('preHandler', async (request) => {
      if (opts.skipIfAlreadyAuthenticated && request.isAuthenticated && request.jwtPayload) {
        return
      }

      request.jwt = (request.headers.authorization || '').replace(BEARER, '')

      if (!request.jwt && request.routeOptions.config.allowInvalidJwt) {
        request.jwtPayload = { role: 'anon' }
        request.isAuthenticated = false
        return
      }

      const { secret, jwks } = await getJwtSecret(request.tenantId)

      try {
        const payload = await (jwtCachingEnabled
          ? verifyJWTWithCache(request.jwt, secret, jwks || null)
          : verifyJWT(request.jwt, secret, jwks || null))

        request.jwtPayload = payload
        request.owner = payload.sub
        request.isAuthenticated = true
      } catch (e) {
        request.jwtPayload = { role: 'anon' }
        request.isAuthenticated = false

        if (request.routeOptions.config.allowInvalidJwt) {
          return
        }
        const err = e as Error
        throw ERRORS.AccessDenied(err.message, err)
      }
    })

    if (opts.enforceJwtRoles && opts.enforceJwtRoles.length > 0) {
      fastify.register(enforceJwtRole, {
        roles: opts.enforceJwtRoles,
      })
    }
  },
  { name: 'auth-jwt' }
)

interface EnforceJWTRoleOptions {
  roles: string[]
}

export const enforceJwtRole = fastifyPlugin<EnforceJWTRoleOptions>(
  async (fastify, opts) => {
    fastify.addHook('preHandler', (request, _reply, done) => {
      if (!request.isAuthenticated) {
        done(ERRORS.AccessDenied('Access denied: JWT is not authenticated').withStatusCode(403))
        return
      }

      const hasRoles = request.jwtPayload?.role && opts.roles.includes(request.jwtPayload.role)

      if (!hasRoles) {
        done(ERRORS.AccessDenied(`Access denied: Invalid role`).withStatusCode(403))
        return
      }

      done()
    })
  },
  { name: 'enforce-jwt-role' }
)

export function registerJwtAuth(fastify: FastifyInstance, opts: JWTPluginOptions = {}) {
  fastify.addHook('onRoute', (routeOptions) => {
    routeOptions.schema = routeOptions.schema || {}
    routeOptions.schema.security = [{ bearerAuth: [] }]
  })
  fastify.register(jwtPlugin, opts)
}
