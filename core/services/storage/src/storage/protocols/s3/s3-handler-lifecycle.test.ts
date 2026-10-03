import { ErrorCode } from '@internal/errors'
import * as config from '../../../config'
import { Storage } from '../../storage'

describe('S3ProtocolHandler lifecycle configuration', () => {
  let Handler: typeof import('./s3-handler').S3ProtocolHandler
  let storageLifecycleEnabled = true

  beforeAll(async () => {
    const configured = config.getConfig()
    vi.resetModules()
    vi.doMock('../../../config', () => ({
      ...config,
      getConfig: () => ({
        ...configured,
        storageLifecycleEnabled,
      }),
    }))
    Handler = (await import('./s3-handler')).S3ProtocolHandler
  })

  afterEach(() => {
    storageLifecycleEnabled = true
  })

  afterAll(() => {
    vi.doUnmock('../../../config')
    vi.resetModules()
  })

  function createHandler(bucketOverrides: Record<string, unknown> = {}) {
    const bucket = {
      id: 'bucket',
      name: 'bucket',
      type: 'STANDARD',
      lifecycle_configuration: null,
      lifecycle_configuration_generation: null,
      ...bucketOverrides,
    }
    const db = {
      deleteLifecycleConfiguration: vi.fn().mockResolvedValue(bucket),
      findLifecycleBucket: vi.fn().mockResolvedValue(bucket),
      hasMigration: vi.fn().mockResolvedValue(true),
      putLifecycleConfiguration: vi.fn().mockResolvedValue(bucket),
    }

    return {
      db,
      handler: new Handler(
        new Storage({} as never, db as never, {} as never),
        'tenant-id',
        'owner-id'
      ),
    }
  }

  it('returns NoSuchLifecycleConfiguration for an accessible bucket without a policy', async () => {
    const { handler } = createHandler()

    await expect(handler.getBucketLifecycle('bucket')).rejects.toMatchObject({
      code: ErrorCode.NoSuchLifecycleConfiguration,
      httpStatusCode: 404,
    })
  })

  it('normalizes a lifecycle PUT before persistence', async () => {
    const { db, handler } = createHandler()

    await expect(
      handler.putBucketLifecycle('bucket', {
        LifecycleConfiguration: {
          Rule: [
            {
              ID: 'expire',
              Status: 'Enabled',
              Filter: '',
              NoncurrentVersionExpiration: {
                NoncurrentDays: '30',
                NewerNoncurrentVersions: '2',
              },
            },
          ],
        },
      })
    ).resolves.toEqual({ statusCode: 200 })
    expect(db.putLifecycleConfiguration).toHaveBeenCalledWith('bucket', {
      rules: [
        {
          id: 'expire',
          status: 'Enabled',
          filter: {},
          noncurrentVersionExpiration: {
            noncurrentDays: 30,
            newerNoncurrentVersions: 2,
          },
        },
      ],
    })
  })

  it.each([
    {
      rules: [{ Status: 'Enabled', NoncurrentVersionExpiration: { NoncurrentDays: '1' } }],
      code: ErrorCode.MalformedXML,
      message: 'Rule 1 must contain Filter',
    },
    {
      rules: [
        {
          ID: 'duplicate',
          Status: 'Enabled',
          Filter: {},
          NoncurrentVersionExpiration: { NoncurrentDays: '1' },
        },
        {
          ID: 'duplicate',
          Status: 'Disabled',
          Filter: {},
          NoncurrentVersionExpiration: { NoncurrentDays: '2' },
        },
      ],
      code: ErrorCode.InvalidArgument,
      message: 'Rule ID must be unique. Found same ID for more than one rule',
    },
    {
      rules: [
        { Status: 'Enabled', Prefix: '', NoncurrentVersionExpiration: { NoncurrentDays: '1' } },
      ],
      code: ErrorCode.InvalidRequest,
      message: 'Rule 1 contains unsupported element Prefix; use Filter instead',
    },
  ])('maps lifecycle validation to $code without persistence', async ({ rules, code, message }) => {
    const { db, handler } = createHandler()
    await expect(
      handler.putBucketLifecycle('bucket', {
        LifecycleConfiguration: { Rule: rules },
      })
    ).rejects.toMatchObject({ code, message })
    expect(db.putLifecycleConfiguration).not.toHaveBeenCalled()
  })

  it('checks migration readiness before validating or persisting a PUT', async () => {
    const { db, handler } = createHandler()
    db.hasMigration.mockResolvedValue(false)

    await expect(handler.putBucketLifecycle('bucket', null)).rejects.toMatchObject({
      code: ErrorCode.FeatureNotEnabled,
    })
    expect(db.hasMigration).toHaveBeenCalledWith('bucket-lifecycle-configuration')
    expect(db.putLifecycleConfiguration).not.toHaveBeenCalled()
  })

  it('deletes lifecycle configuration idempotently through the database contract', async () => {
    const { db, handler } = createHandler()

    await expect(handler.deleteBucketLifecycle('bucket')).resolves.toEqual({ statusCode: 204 })
    expect(db.deleteLifecycleConfiguration).toHaveBeenCalledWith('bucket')
    expect(db.hasMigration).not.toHaveBeenCalled()
  })

  it('rejects every lifecycle operation when the feature flag is disabled', async () => {
    storageLifecycleEnabled = false
    const { db, handler } = createHandler()

    await expect(handler.getBucketLifecycle('bucket')).rejects.toMatchObject({
      code: ErrorCode.FeatureNotEnabled,
    })
    await expect(handler.putBucketLifecycle('bucket', null)).rejects.toMatchObject({
      code: ErrorCode.FeatureNotEnabled,
    })
    await expect(handler.deleteBucketLifecycle('bucket')).rejects.toMatchObject({
      code: ErrorCode.FeatureNotEnabled,
    })
    expect(db.findLifecycleBucket).not.toHaveBeenCalled()
    expect(db.putLifecycleConfiguration).not.toHaveBeenCalled()
    expect(db.deleteLifecycleConfiguration).not.toHaveBeenCalled()
  })
})
