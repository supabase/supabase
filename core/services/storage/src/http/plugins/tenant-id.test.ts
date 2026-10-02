import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify'
import { getConfig } from '../../config'
import { adminTenantId, tenantId } from './tenant-id'

const { tenantId: defaultTenantId } = getConfig()

function failOnRequestChildLogger(app: FastifyInstance) {
  app.addHook('onRequest', async (request: FastifyRequest) => {
    request.log.child = (() => {
      throw new Error('request.log.child should not be called by the tenant id plugin')
    }) as typeof request.log.child
  })
}

describe('tenant id plugins', () => {
  it('does not create an extra request child logger for API requests', async () => {
    const app = Fastify()

    failOnRequestChildLogger(app)
    await app.register(tenantId)
    app.get('/status', async () => ({ ok: true }))

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/status',
      })

      expect(response.statusCode).toBe(200)
    } finally {
      await app.close()
    }
  })

  it('does not create an extra request child logger for admin requests', async () => {
    const app = Fastify()

    failOnRequestChildLogger(app)
    await app.register(adminTenantId)
    app.get('/tenants/:tenantId', async (request) => ({ tenantId: request.tenantId }))

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/tenants/tenant-a',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ tenantId: 'tenant-a' })
    } finally {
      await app.close()
    }
  })

  it('sets the default tenant id for admin requests without tenant params', async () => {
    const app = Fastify()

    failOnRequestChildLogger(app)
    await app.register(adminTenantId)
    app.get('/status', async (request) => ({ tenantId: request.tenantId }))

    try {
      const response = await app.inject({
        method: 'GET',
        url: '/status',
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual({ tenantId: defaultTenantId })
    } finally {
      await app.close()
    }
  })
})
