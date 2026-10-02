import { ErrorCode } from '@internal/errors'
import fastify from 'fastify'
import { setErrorHandler } from '../../error-handler'
import { withFiniteAjv } from '../../finite'
import { authSchema } from '../../schemas/auth'
import { errorSchema } from '../../schemas/error'

describe('REST bucket lifecycle feature flag', () => {
  it('keeps generic writes closed and rejects dedicated lifecycle routes when disabled', async () => {
    const config = await import('../../../config')
    const configured = config.getConfig()
    vi.resetModules()
    vi.doMock('../../../config', () => ({
      ...config,
      getConfig: () => ({
        ...configured,
        storageLifecycleEnabled: false,
      }),
    }))

    const [{ default: createBucket }, { default: lifecycle }, { default: updateBucket }] =
      await Promise.all([import('./createBucket'), import('./lifecycle'), import('./updateBucket')])
    const storage = {
      createBucket: vi.fn(),
      deleteBucketLifecycle: vi.fn(),
      db: {
        hasMigration: vi.fn(),
      },
      getBucketLifecycle: vi.fn(),
      putBucketLifecycle: vi.fn(),
      updateBucket: vi.fn(),
    }
    const app = fastify(withFiniteAjv({}))
    app.decorateRequest('owner')
    app.decorateRequest('storage')
    app.addHook('preHandler', async (request) => {
      request.owner = 'owner-id'
      request.storage = storage as never
    })
    app.addSchema(authSchema)
    app.addSchema(errorSchema)
    app.register(createBucket)
    app.register(lifecycle)
    app.register(updateBucket)
    setErrorHandler(app)

    const lifecycleConfiguration = {
      rules: [
        {
          status: 'Enabled',
          filter: {},
          noncurrentVersionExpiration: { noncurrentDays: 30 },
        },
      ],
    }

    try {
      const createResponse = await app.inject({
        method: 'POST',
        url: '/',
        headers: { authorization: 'Bearer test' },
        payload: {
          name: 'avatars',
          lifecycle_configuration: lifecycleConfiguration,
        },
      })
      const updateResponse = await app.inject({
        method: 'PUT',
        url: '/avatars',
        headers: { authorization: 'Bearer test' },
        payload: { public: true, lifecycle_configuration: lifecycleConfiguration },
      })

      expect(createResponse.statusCode).toBe(400)
      expect(updateResponse.statusCode).toBe(400)

      for (const method of ['GET', 'PUT', 'DELETE'] as const) {
        const response = await app.inject({
          method,
          url: '/avatars/lifecycle',
          headers: { authorization: 'Bearer test' },
          ...(method === 'PUT' ? { payload: lifecycleConfiguration } : {}),
        })
        expect(response.statusCode).toBe(400)
        expect(response.json()).toMatchObject({ code: ErrorCode.FeatureNotEnabled })
      }

      expect(storage.db.hasMigration).not.toHaveBeenCalled()
      expect(storage.createBucket).not.toHaveBeenCalled()
      expect(storage.updateBucket).not.toHaveBeenCalled()
      expect(storage.getBucketLifecycle).not.toHaveBeenCalled()
      expect(storage.putBucketLifecycle).not.toHaveBeenCalled()
      expect(storage.deleteBucketLifecycle).not.toHaveBeenCalled()
    } finally {
      await app.close()
      vi.doUnmock('../../../config')
      vi.resetModules()
    }
  })
})
