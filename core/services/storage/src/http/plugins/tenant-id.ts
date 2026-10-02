import { getXForwardedHostRegExp } from '@internal/http/x-forwarded-host'
import fastifyPlugin from 'fastify-plugin'
import { getConfig } from '../../config'

declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string
  }
}

const { isMultitenant, tenantId: defaultTenantId } = getConfig()

const xForwardedHostRegExp = getXForwardedHostRegExp()

export const tenantId = fastifyPlugin(
  async (fastify) => {
    fastify.decorateRequest('tenantId', defaultTenantId)
    fastify.addHook('onRequest', (request, _reply, done) => {
      if (!isMultitenant || !xForwardedHostRegExp) {
        done()
        return
      }

      const xForwardedHost = request.headers['x-forwarded-host']
      if (typeof xForwardedHost !== 'string') {
        done()
        return
      }

      const result = xForwardedHost.match(xForwardedHostRegExp)
      if (!result) {
        done()
        return
      }

      request.tenantId = result[1]
      done()
    })
  },
  { name: 'tenant-id' }
)

export const adminTenantId = fastifyPlugin(
  async (fastify) => {
    fastify.decorateRequest('tenantId', defaultTenantId)
    fastify.addHook('onRequest', (request, _reply, done) => {
      const tenantId = (request.params as Record<string, undefined | string>).tenantId
      if (!tenantId) {
        done()
        return
      }

      request.tenantId = tenantId
      done()
    })
  },
  { name: 'admin-tenant-id' }
)
