import { DBMigration } from '@internal/database/migrations'
import { ErrorCode } from '@internal/errors'
import fastify from 'fastify'
import { vi } from 'vitest'
import { withFiniteAjv } from '../../finite'
import { errorSchema } from '../../schemas/error'

async function createApp(
  latestMigration: keyof typeof DBMigration,
  { isMultitenant = true }: { isMultitenant?: boolean } = {}
) {
  vi.resetModules()
  const configModule = await import('../../../config')
  configModule.getConfig({ reload: true })
  configModule.mergeConfig({ isMultitenant })
  const { default: listObjectsV2 } = await import('./listObjectsV2')

  const list = vi.fn().mockResolvedValue([])
  const app = fastify(withFiniteAjv({}))

  app.addSchema(errorSchema)
  app.decorateRequest('latestMigration')
  app.decorateRequest('storage')
  app.addHook('preHandler', async (request) => {
    request.latestMigration = latestMigration
    request.storage = {
      from: () => ({ listObjectsV2: list }),
    } as never
  })
  app.register(listObjectsV2)

  await app.ready()
  return { app, list }
}

describe('listObjectsV2 migration gate', () => {
  test('returns the shared error contract for an old multitenant migration', async () => {
    const { app, list } = await createApp('initialmigration')

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/list-v2/bucket',
        payload: {},
      })

      expect(response.statusCode).toBe(400)
      expect(response.json()).toEqual({
        statusCode: '400',
        error: 'FeatureNotEnabled',
        message: 'This feature is not available for your tenant',
        code: ErrorCode.FeatureNotEnabled,
      })
      expect(list).not.toHaveBeenCalled()
    } finally {
      await app.close()
    }
  })

  test('allows a supported migration version from multitenant request context', async () => {
    const { app, list } = await createApp('search-v2')

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/list-v2/bucket',
        payload: {},
      })

      expect(response.statusCode).toBe(200)
      expect(list).toHaveBeenCalledOnce()
    } finally {
      await app.close()
    }
  })

  test('allows an old migration version in single-tenant mode', async () => {
    const { app, list } = await createApp('initialmigration', { isMultitenant: false })

    try {
      const response = await app.inject({
        method: 'POST',
        url: '/list-v2/bucket',
        payload: {},
      })

      expect(response.statusCode).toBe(200)
      expect(list).toHaveBeenCalledOnce()
    } finally {
      await app.close()
    }
  })
})
