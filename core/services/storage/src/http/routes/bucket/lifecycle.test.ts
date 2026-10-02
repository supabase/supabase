import fastify, { type FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LifecycleRule } from '../../../storage/schemas/lifecycle'
import { setErrorHandler } from '../../error-handler'
import { withFiniteAjv } from '../../finite'
import { authSchema } from '../../schemas/auth'
import { errorSchema } from '../../schemas/error'
import createBucket from './createBucket'
import getBucket from './getBucket'
import lifecycle from './lifecycle'
import updateBucket from './updateBucket'

vi.mock('../../../config', async (importOriginal) => {
  const config = await importOriginal<typeof import('../../../config')>()
  const configured = config.getConfig()
  return {
    ...config,
    getConfig: () => ({
      ...configured,
      storageLifecycleEnabled: true,
    }),
  }
})

const lifecycleConfiguration = {
  rules: [
    {
      id: 'expire-history',
      status: 'Enabled' as const,
      filter: {},
      noncurrentVersionExpiration: {
        noncurrentDays: 30,
        newerNoncurrentVersions: 2,
      },
    },
  ],
}

const bucket = {
  id: 'avatars',
  name: 'avatars',
  owner: 'owner-id',
  public: false,
  type: 'STANDARD' as const,
  created_at: '2026-08-18T00:00:00.000Z',
  updated_at: '2026-08-18T00:00:00.000Z',
  file_size_limit: null,
  allowed_mime_types: null,
}

describe('REST bucket lifecycle configuration routes', () => {
  let app: FastifyInstance
  let storage: {
    createBucket: ReturnType<typeof vi.fn>
    deleteBucketLifecycle: ReturnType<typeof vi.fn>
    db: {
      hasMigration: ReturnType<typeof vi.fn>
    }
    findBucket: ReturnType<typeof vi.fn>
    getBucketLifecycle: ReturnType<typeof vi.fn>
    putBucketLifecycle: ReturnType<typeof vi.fn>
    updateBucket: ReturnType<typeof vi.fn>
  }

  beforeEach(async () => {
    storage = {
      createBucket: vi.fn().mockResolvedValue(undefined),
      deleteBucketLifecycle: vi.fn().mockResolvedValue(undefined),
      db: {
        hasMigration: vi.fn().mockResolvedValue(true),
      },
      findBucket: vi.fn().mockResolvedValue(bucket),
      getBucketLifecycle: vi.fn().mockResolvedValue(lifecycleConfiguration),
      putBucketLifecycle: vi.fn().mockResolvedValue(lifecycleConfiguration),
      updateBucket: vi.fn().mockResolvedValue(undefined),
    }
    app = fastify(withFiniteAjv({}))
    app.addSchema(authSchema)
    app.addSchema(errorSchema)
    app.decorateRequest('owner')
    app.decorateRequest('storage')
    app.addHook('preHandler', async (request) => {
      request.owner = 'owner-id'
      request.storage = storage as never
    })
    app.register(createBucket)
    app.register(getBucket)
    app.register(lifecycle)
    app.register(updateBucket)
    setErrorHandler(app)
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it('rejects legacyPrefix even when a supported filter is supplied', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
      payload: {
        rules: [{ ...lifecycleConfiguration.rules[0], legacyPrefix: '' }],
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      code: 'InvalidParameter',
      message: 'Rule 1 contains unsupported field legacyPrefix',
    })
    expect(storage.putBucketLifecycle).not.toHaveBeenCalled()
  })

  it('rejects lifecycle configuration on generic bucket create and update', async () => {
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
      payload: {
        public: true,
        lifecycle_configuration: lifecycleConfiguration,
      },
    })

    expect(createResponse.statusCode).toBe(400)
    expect(updateResponse.statusCode).toBe(400)
    expect(storage.createBucket).not.toHaveBeenCalled()
    expect(storage.updateBucket).not.toHaveBeenCalled()
  })

  it.each([
    {},
    { prefix: '' },
  ])('normalizes filter %j through the dedicated PUT route', async (filter) => {
    const response = await app.inject({
      method: 'PUT',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
      payload: { rules: [{ ...lifecycleConfiguration.rules[0], filter }] },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(lifecycleConfiguration)
    const put = storage.putBucketLifecycle
    expect(put).toHaveBeenCalledWith('avatars', lifecycleConfiguration)
  })

  it.each([
    { prefix: 'logs/' },
    { prefix: ' ' },
    { prefix: null },
    { prefix: '', tag: { key: 'kind', value: 'logs' } },
  ])('rejects unsupported filter %j before persistence', async (filter) => {
    const response = await app.inject({
      method: 'PUT',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
      payload: { rules: [{ ...lifecycleConfiguration.rules[0], filter }] },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ code: 'InvalidParameter' })
    expect(storage.putBucketLifecycle).not.toHaveBeenCalled()
  })

  it('checks migration readiness before semantic PUT validation', async () => {
    storage.db.hasMigration.mockResolvedValueOnce(false)

    const response = await app.inject({
      method: 'PUT',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
      payload: {
        rules: [
          {
            ...lifecycleConfiguration.rules[0],
            filter: { prefix: 'unsupported' },
          },
        ],
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ code: 'FeatureNotEnabled' })
    expect(storage.db.hasMigration).toHaveBeenCalledWith('bucket-lifecycle-configuration')
    expect(storage.putBucketLifecycle).not.toHaveBeenCalled()
  })

  it.each([
    { status: 'Enabled', filter: null, noncurrentVersionExpiration: { noncurrentDays: 30 } },
    { ...lifecycleConfiguration.rules[0], id: null },
    { ...lifecycleConfiguration.rules[0], id: 123 },
    {
      ...lifecycleConfiguration.rules[0],
      noncurrentVersionExpiration: { noncurrentDays: true },
    },
    {
      ...lifecycleConfiguration.rules[0],
      noncurrentVersionExpiration: { noncurrentDays: 30, newerNoncurrentVersions: true },
    },
    {
      ...lifecycleConfiguration.rules[0],
      noncurrentVersionExpiration: { noncurrentDays: '30' },
    },
  ])('rejects lifecycle scalar coercion before persistence: %j', async (rule) => {
    const response = await app.inject({
      method: 'PUT',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
      payload: { rules: [rule] },
    })

    expect(response.statusCode).toBe(400)
    expect(storage.putBucketLifecycle).not.toHaveBeenCalled()
  })

  it('retains authorization-header validation on lifecycle PUT', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/avatars/lifecycle',
      payload: lifecycleConfiguration,
    })

    expect(response.statusCode).toBe(400)
    expect(storage.putBucketLifecycle).not.toHaveBeenCalled()
  })

  it('preserves scalar coercion on generic bucket routes', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/avatars',
      headers: { authorization: 'Bearer test' },
      payload: { public: 'true' },
    })

    expect(response.statusCode).toBe(200)
    expect(storage.updateBucket).toHaveBeenCalledWith(
      'avatars',
      expect.objectContaining({ public: true })
    )
  })

  const configurations = [
    {
      id: 'filter',
      status: 'Enabled',
      filter: {},
      noncurrentVersionExpiration: { noncurrentDays: 30, newerNoncurrentVersions: 2 },
    },
    {
      id: 'disabled',
      status: 'Disabled',
      filter: {},
      noncurrentVersionExpiration: { noncurrentDays: 7 },
    },
  ] satisfies LifecycleRule[]

  it.each(configurations)('returns valid lifecycle configuration: %j', async (rule) => {
    const configuration = { rules: [rule] }
    storage.getBucketLifecycle.mockResolvedValueOnce(configuration)
    const response = await app.inject({
      method: 'GET',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
    })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(configuration)
  })

  it.each([
    { status: 'Enabled', noncurrentVersionExpiration: { noncurrentDays: 30 } },
    { status: 'Enabled', legacyPrefix: '', noncurrentVersionExpiration: { noncurrentDays: 30 } },
    { filter: {}, noncurrentVersionExpiration: { noncurrentDays: 30 } },
    { status: 'Enabled', filter: {} },
    { status: 'Enabled', filter: {}, noncurrentVersionExpiration: {} },
  ])('rejects incomplete lifecycle configuration before persistence: %j', async (rule) => {
    const response = await app.inject({
      method: 'PUT',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
      payload: {
        rules: [rule],
      },
    })

    expect(response.statusCode).toBe(400)
    expect(storage.putBucketLifecycle).not.toHaveBeenCalled()
  })

  it('returns lifecycle configuration without exposing its generation', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(lifecycleConfiguration)
    expect(response.json()).not.toHaveProperty('lifecycle_configuration_generation')
    expect(storage.getBucketLifecycle).toHaveBeenCalledWith('avatars')
  })

  it('returns NoSuchLifecycleConfiguration when the dedicated resource is absent', async () => {
    storage.getBucketLifecycle.mockResolvedValueOnce(null)

    const response = await app.inject({
      method: 'GET',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ code: 'NoSuchLifecycleConfiguration' })
  })

  it('deletes lifecycle configuration idempotently', async () => {
    const first = await app.inject({
      method: 'DELETE',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
    })
    const retry = await app.inject({
      method: 'DELETE',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
    })

    expect(first.statusCode).toBe(200)
    expect(retry.statusCode).toBe(200)
    expect(first.json()).toEqual({ message: 'Successfully deleted' })
    expect(retry.json()).toEqual({ message: 'Successfully deleted' })
    expect(storage.deleteBucketLifecycle).toHaveBeenCalledTimes(2)
    expect(storage.deleteBucketLifecycle).toHaveBeenNthCalledWith(1, 'avatars')
    expect(storage.deleteBucketLifecycle).toHaveBeenNthCalledWith(2, 'avatars')
  })

  it.each([
    '/avatars',
    '/avatars?include=lifecycle',
  ])('does not fetch lifecycle JSON on a generic bucket read: %s', async (url) => {
    const response = await app.inject({
      method: 'GET',
      url,
      headers: { authorization: 'Bearer test' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).not.toHaveProperty('lifecycle_configuration')
    expect(storage.db.hasMigration).not.toHaveBeenCalled()
    expect(storage.findBucket).toHaveBeenCalledWith(
      'avatars',
      expect.not.stringContaining('lifecycle_configuration')
    )
  })

  it.each([
    2147483647,
    2147483648,
    Number.MAX_SAFE_INTEGER,
  ])('enforces the REST noncurrentDays upper bound for %s', async (noncurrentDays) => {
    const configuration = {
      rules: [
        { ...lifecycleConfiguration.rules[0], noncurrentVersionExpiration: { noncurrentDays } },
      ],
    }
    const response = await app.inject({
      method: 'PUT',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
      payload: configuration,
    })
    if (noncurrentDays === 2147483647) {
      expect(response.statusCode).toBe(200)
      expect(storage.putBucketLifecycle).toHaveBeenCalledWith('avatars', configuration)
    } else {
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchObject({
        code: 'InvalidParameter',
        message: 'The integer value must be less than or equal to 2147483647.',
      })
      expect(storage.putBucketLifecycle).not.toHaveBeenCalled()
    }
  })

  it('maps semantic validation errors to REST InvalidParameter with the original message', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
      payload: {
        rules: [
          {
            ...lifecycleConfiguration.rules[0],
            noncurrentVersionExpiration: { noncurrentDays: 0 },
          },
        ],
      },
    })
    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      code: 'InvalidParameter',
      message: "'NoncurrentDays' for NoncurrentVersionExpiration action must be a positive integer",
    })
    expect(storage.putBucketLifecycle).not.toHaveBeenCalled()
  })

  it.each([
    'a'.repeat(256),
    '😀'.repeat(128),
  ])('maps an overlong rule ID to REST InvalidParameter: %s', async (id) => {
    const response = await app.inject({
      method: 'PUT',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
      payload: {
        rules: [
          {
            ...lifecycleConfiguration.rules[0],
            id,
          },
        ],
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      code: 'InvalidParameter',
      message: 'Rule 1 ID must be 255 characters or fewer',
    })
    expect(storage.putBucketLifecycle).not.toHaveBeenCalled()
  })

  it('rejects a mixed canonical and S3 lifecycle body', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
      payload: {
        ...lifecycleConfiguration,
        LifecycleConfiguration: {
          Rule: {
            ID: 'other',
            Status: 'Disabled',
            Filter: {},
            NoncurrentVersionExpiration: { NoncurrentDays: 1 },
          },
        },
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      code: 'InvalidParameter',
      message: 'Lifecycle configuration contains unsupported field LifecycleConfiguration',
    })
    expect(storage.putBucketLifecycle).not.toHaveBeenCalled()
  })

  it('rejects an empty lifecycle rule set before invoking the database', async () => {
    const response = await app.inject({
      method: 'PUT',
      url: '/avatars/lifecycle',
      headers: { authorization: 'Bearer test' },
      payload: { rules: [] },
    })

    expect(response.statusCode).toBe(400)
    expect(storage.putBucketLifecycle).not.toHaveBeenCalled()
  })
})
