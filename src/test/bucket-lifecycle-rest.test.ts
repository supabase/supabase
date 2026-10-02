import { randomUUID } from 'node:crypto'
import {
  DeleteBucketLifecycleCommand,
  GetBucketLifecycleConfigurationCommand,
  PutBucketLifecycleConfigurationCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { signJWT } from '@internal/auth'
import type { StoragePgDB } from '@storage/database'
import type { FastifyInstance } from 'fastify'

describe('REST bucket lifecycle configuration', () => {
  let appInstance: FastifyInstance
  let adminDb: StoragePgDB
  let authorizationKey: string
  let jwtSecret: string
  let s3Client: S3Client
  let previousLifecycleEnabled: string | undefined
  const bucketIds = new Set<string>()

  beforeAll(async () => {
    previousLifecycleEnabled = process.env.STORAGE_LIFECYCLE_ENABLED
    process.env.STORAGE_LIFECYCLE_ENABLED = 'true'

    vi.resetModules()
    const configModule = await import('../config')
    configModule.setEnvPaths(['.env.test', '.env'])
    const config = configModule.getConfig({ reload: true })

    const [{ default: buildApp }, databaseModule, migrationModule, storageDatabaseModule] =
      await Promise.all([
        import('../app'),
        import('@internal/database'),
        import('@internal/database/migrations'),
        import('@storage/database'),
      ])

    await migrationModule.runMigrationsOnTenant({
      databaseUrl: config.databaseURL,
      tenantId: config.tenantId,
      waitForLock: true,
    })

    const serviceKeyUser = await databaseModule.getServiceKeyUser(config.tenantId)
    const connection = await databaseModule.getPostgresConnection({
      superUser: serviceKeyUser,
      user: serviceKeyUser,
      tenantId: config.tenantId,
      host: 'localhost',
    })

    adminDb = new storageDatabaseModule.StoragePgDB(connection, {
      host: 'localhost',
      tenantId: config.tenantId,
    })
    authorizationKey = process.env.AUTHENTICATED_KEY || ''
    jwtSecret = config.jwtSecret
    appInstance = buildApp()
    const listener = await appInstance.listen()
    s3Client = new S3Client({
      endpoint: `${listener.replace('[::1]', 'localhost')}/s3`,
      forcePathStyle: true,
      region: config.storageS3Region,
      credentials: {
        accessKeyId: config.s3ProtocolAccessKeyId!,
        secretAccessKey: config.s3ProtocolAccessKeySecret!,
      },
    })
  })

  afterEach(async () => {
    for (const bucketId of bucketIds) {
      const bucket = await adminDb.findBucketById(bucketId, 'id', { dontErrorOnEmpty: true })
      if (bucket) await adminDb.deleteBucket(bucketId)
    }
    bucketIds.clear()
  })

  afterAll(async () => {
    try {
      s3Client?.destroy()
      await appInstance?.close()
    } finally {
      try {
        adminDb?.destroyConnection()
      } finally {
        if (previousLifecycleEnabled === undefined) {
          delete process.env.STORAGE_LIFECYCLE_ENABLED
        } else {
          process.env.STORAGE_LIFECYCLE_ENABLED = previousLifecycleEnabled
        }
      }
    }
  })

  const rules = [
    {
      id: 'expire-history',
      status: 'Enabled' as const,
      filter: {},
      noncurrentVersionExpiration: {
        noncurrentDays: 30,
        newerNoncurrentVersions: 2,
      },
    },
    {
      id: 'keep-short-history',
      status: 'Disabled' as const,
      filter: {},
      noncurrentVersionExpiration: { noncurrentDays: 7 },
    },
  ]

  it('round-trips AWS SDK lifecycle XML through the router and database', async () => {
    const bucketId = `s3-lifecycle-${randomUUID()}`
    bucketIds.add(bucketId)
    await adminDb.createBucket({ id: bucketId, name: bucketId, public: false })

    await s3Client.send(
      new PutBucketLifecycleConfigurationCommand({
        Bucket: bucketId,
        LifecycleConfiguration: {
          Rules: [
            {
              ID: 'expire-history',
              Status: 'Enabled',
              Filter: { Prefix: '' },
              NoncurrentVersionExpiration: { NoncurrentDays: 30 },
            },
          ],
        },
      })
    )

    await expect(adminDb.findLifecycleBucket(bucketId)).resolves.toMatchObject({
      lifecycle_configuration: {
        rules: [
          {
            id: 'expire-history',
            status: 'Enabled',
            filter: {},
            noncurrentVersionExpiration: { noncurrentDays: 30 },
          },
        ],
      },
    })

    const read = await s3Client.send(
      new GetBucketLifecycleConfigurationCommand({ Bucket: bucketId })
    )
    expect(read.Rules).toEqual([
      {
        ID: 'expire-history',
        Status: 'Enabled',
        Filter: {},
        NoncurrentVersionExpiration: { NoncurrentDays: 30 },
      },
    ])

    await expect(
      s3Client.send(
        new PutBucketLifecycleConfigurationCommand({
          Bucket: bucketId,
          LifecycleConfiguration: {
            Rules: [
              {
                ID: 'unsupported-prefix',
                Status: 'Enabled',
                Filter: { Prefix: 'logs/' },
                NoncurrentVersionExpiration: { NoncurrentDays: 30 },
              },
            ],
          },
        })
      )
    ).rejects.toMatchObject({
      name: 'InvalidRequest',
      $metadata: { httpStatusCode: 400 },
    })

    await expect(
      s3Client.send(new DeleteBucketLifecycleCommand({ Bucket: bucketId }))
    ).resolves.toMatchObject({ $metadata: { httpStatusCode: 204 } })
    await expect(adminDb.findLifecycleBucket(bucketId)).resolves.toMatchObject({
      lifecycle_configuration: null,
      lifecycle_configuration_generation: null,
    })
    await expect(
      s3Client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucketId }))
    ).rejects.toMatchObject({
      name: 'NoSuchLifecycleConfiguration',
      $metadata: { httpStatusCode: 404 },
    })
  })

  it('returns NoSuchBucket for S3 lifecycle operations on a missing bucket', async () => {
    const bucketId = `missing-s3-lifecycle-${randomUUID()}`
    const operations = [
      () =>
        s3Client.send(
          new PutBucketLifecycleConfigurationCommand({
            Bucket: bucketId,
            LifecycleConfiguration: {
              Rules: [
                {
                  ID: 'expire-history',
                  Status: 'Enabled',
                  Filter: {},
                  NoncurrentVersionExpiration: { NoncurrentDays: 30 },
                },
              ],
            },
          })
        ),
      () => s3Client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucketId })),
      () => s3Client.send(new DeleteBucketLifecycleCommand({ Bucket: bucketId })),
    ]

    for (const operation of operations) {
      await expect(operation()).rejects.toMatchObject({
        name: 'NoSuchBucket',
        $metadata: { httpStatusCode: 404 },
      })
    }
  })

  it('replaces, reads, and idempotently deletes the REST lifecycle resource', async () => {
    const bucketId = `rest-lifecycle-${randomUUID()}`
    bucketIds.add(bucketId)

    const createResponse = await appInstance.inject({
      method: 'POST',
      url: '/bucket',
      headers: { authorization: `Bearer ${authorizationKey}` },
      payload: { name: bucketId },
    })
    expect(createResponse.statusCode).toBe(200)

    const defaultRead = await appInstance.inject({
      method: 'GET',
      url: `/bucket/${bucketId}`,
      headers: { authorization: `Bearer ${authorizationKey}` },
    })
    expect(defaultRead.statusCode).toBe(200)
    expect(defaultRead.json()).not.toHaveProperty('lifecycle_configuration')

    const putResponse = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${bucketId}/lifecycle`,
      headers: { authorization: `Bearer ${authorizationKey}` },
      payload: { rules },
    })
    expect(putResponse.statusCode).toBe(200)
    expect(putResponse.json()).toEqual({ rules })

    const created = await adminDb.findLifecycleBucket(bucketId)
    expect(created.lifecycle_configuration).toEqual({ rules })
    expect(created.lifecycle_configuration_generation).toMatch(/^[0-9a-f-]{36}$/i)

    const lifecycleRead = await appInstance.inject({
      method: 'GET',
      url: `/bucket/${bucketId}/lifecycle`,
      headers: { authorization: `Bearer ${authorizationKey}` },
    })
    expect(lifecycleRead.statusCode).toBe(200)
    expect(lifecycleRead.json()).toEqual({ rules })

    const bucketReadAfterPut = await appInstance.inject({
      method: 'GET',
      url: `/bucket/${bucketId}`,
      headers: { authorization: `Bearer ${authorizationKey}` },
    })
    expect(bucketReadAfterPut.statusCode).toBe(200)
    expect(bucketReadAfterPut.json()).not.toHaveProperty('lifecycle_configuration')

    const listResponse = await appInstance.inject({
      method: 'GET',
      url: '/bucket',
      headers: { authorization: `Bearer ${authorizationKey}` },
    })
    expect(listResponse.statusCode).toBe(200)
    expect(
      (listResponse.json() as Array<{ id: string }>).find((bucket) => bucket.id === bucketId)
    ).not.toHaveProperty('lifecycle_configuration')

    const reorderedRules = [...rules].reverse()
    const reorderedPut = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${bucketId}/lifecycle`,
      headers: { authorization: `Bearer ${authorizationKey}` },
      payload: { rules: reorderedRules },
    })
    expect(reorderedPut.statusCode).toBe(200)
    expect(reorderedPut.json()).toEqual({ rules })
    const reordered = await adminDb.findLifecycleBucket(bucketId)
    expect(reordered.lifecycle_configuration_generation).toBe(
      created.lifecycle_configuration_generation
    )
    const readAfterReorder = await appInstance.inject({
      method: 'GET',
      url: `/bucket/${bucketId}/lifecycle`,
      headers: { authorization: `Bearer ${authorizationKey}` },
    })
    expect(readAfterReorder.statusCode).toBe(200)
    expect(readAfterReorder.json()).toEqual({ rules })

    const ordinaryUpdate = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${bucketId}`,
      headers: { authorization: `Bearer ${authorizationKey}` },
      payload: { public: true },
    })
    expect(ordinaryUpdate.statusCode).toBe(200)
    await expect(adminDb.findBucketById(bucketId, 'public')).resolves.toMatchObject({
      public: true,
    })

    const replacementRules = [
      {
        ...rules[0],
        noncurrentVersionExpiration: { noncurrentDays: 60 },
      },
    ]
    const replacementResponse = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${bucketId}/lifecycle`,
      headers: { authorization: `Bearer ${authorizationKey}` },
      payload: { rules: replacementRules },
    })
    expect(replacementResponse.statusCode).toBe(200)
    expect(replacementResponse.json()).toEqual({ rules: replacementRules })

    const replaced = await adminDb.findLifecycleBucket(bucketId)
    expect(replaced.lifecycle_configuration_generation).not.toBe(
      created.lifecycle_configuration_generation
    )

    const firstDelete = await appInstance.inject({
      method: 'DELETE',
      url: `/bucket/${bucketId}/lifecycle`,
      headers: { authorization: `Bearer ${authorizationKey}` },
    })
    const repeatedDelete = await appInstance.inject({
      method: 'DELETE',
      url: `/bucket/${bucketId}/lifecycle`,
      headers: { authorization: `Bearer ${authorizationKey}` },
    })
    expect(firstDelete.statusCode).toBe(200)
    expect(repeatedDelete.statusCode).toBe(200)
    expect(firstDelete.json()).toEqual({ message: 'Successfully deleted' })
    expect(repeatedDelete.json()).toEqual({ message: 'Successfully deleted' })

    await expect(adminDb.findLifecycleBucket(bucketId)).resolves.toMatchObject({
      lifecycle_configuration: null,
      lifecycle_configuration_generation: null,
    })

    const missingRead = await appInstance.inject({
      method: 'GET',
      url: `/bucket/${bucketId}/lifecycle`,
      headers: { authorization: `Bearer ${authorizationKey}` },
    })
    expect(missingRead.statusCode).toBe(400)
    expect(missingRead.json()).toMatchObject({ code: 'NoSuchLifecycleConfiguration' })
  })

  it('rejects generic lifecycle writes and invalid dedicated policies without partial changes', async () => {
    const createBucketId = `rest-lifecycle-invalid-create-${randomUUID()}`
    bucketIds.add(createBucketId)

    const createResponse = await appInstance.inject({
      method: 'POST',
      url: '/bucket',
      headers: { authorization: `Bearer ${authorizationKey}` },
      payload: {
        name: createBucketId,
        lifecycle_configuration: { rules },
      },
    })
    expect(createResponse.statusCode).toBe(400)
    await expect(
      adminDb.findBucketById(createBucketId, 'id', { dontErrorOnEmpty: true })
    ).resolves.toBeUndefined()

    const updateBucketId = `rest-lifecycle-invalid-update-${randomUUID()}`
    bucketIds.add(updateBucketId)
    await adminDb.createBucket({ id: updateBucketId, name: updateBucketId, public: false })

    const genericUpdate = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${updateBucketId}`,
      headers: { authorization: `Bearer ${authorizationKey}` },
      payload: {
        public: true,
        lifecycle_configuration: { rules },
      },
    })
    expect(genericUpdate.statusCode).toBe(400)
    await expect(adminDb.findBucketById(updateBucketId, 'public')).resolves.toMatchObject({
      public: false,
    })

    const unsupportedResponse = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${updateBucketId}/lifecycle`,
      headers: { authorization: `Bearer ${authorizationKey}` },
      payload: {
        rules: [
          {
            ...rules[0],
            expiration: { days: 1 },
          },
        ],
      },
    })
    expect(unsupportedResponse.statusCode).toBe(400)
    expect(unsupportedResponse.json()).toMatchObject({ code: 'InvalidParameter' })

    const emptyResponse = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${updateBucketId}/lifecycle`,
      headers: { authorization: `Bearer ${authorizationKey}` },
      payload: { rules: [] },
    })
    expect(emptyResponse.statusCode).toBe(400)
    await expect(adminDb.findLifecycleBucket(updateBucketId)).resolves.toMatchObject({
      lifecycle_configuration: null,
      lifecycle_configuration_generation: null,
    })
  })

  it('preserves read access and updated_at when lifecycle UPDATE permission is denied', async () => {
    const bucketId = `rest-lifecycle-rls-${randomUUID()}`
    const policySuffix = randomUUID().replaceAll('-', '_')
    const selectPolicy = `lifecycle_select_${policySuffix}`
    const updatePolicy = `lifecycle_update_${policySuffix}`
    const restrictedToken = await signJWT(
      { role: 'authenticated', sub: randomUUID() },
      jwtSecret,
      '1h'
    )
    bucketIds.add(bucketId)
    await adminDb.createBucket({ id: bucketId, name: bucketId, public: false })

    const putLifecycle = () =>
      appInstance.inject({
        method: 'PUT',
        url: `/bucket/${bucketId}/lifecycle`,
        headers: { authorization: `Bearer ${restrictedToken}` },
        payload: { rules },
      })

    try {
      const invisible = await putLifecycle()
      expect(invisible.statusCode).toBe(400)
      expect(invisible.json()).toMatchObject({ code: 'NoSuchBucket' })

      await adminDb.connection.query(`
        CREATE POLICY "${selectPolicy}"
        ON storage.buckets
        AS PERMISSIVE
        FOR SELECT
        TO authenticated
        USING (id = '${bucketId}')
      `)

      const readResponse = await appInstance.inject({
        method: 'GET',
        url: `/bucket/${bucketId}`,
        headers: { authorization: `Bearer ${restrictedToken}` },
      })
      expect(readResponse.statusCode).toBe(200)
      expect(readResponse.json()).toMatchObject({ id: bucketId })
      expect(readResponse.json()).not.toHaveProperty('lifecycle_configuration')

      const before = await adminDb.findBucketById(bucketId, 'updated_at')
      const withoutUpdatePolicy = await putLifecycle()
      expect(withoutUpdatePolicy.statusCode).toBe(400)
      expect(withoutUpdatePolicy.json()).toMatchObject({ code: 'AccessDenied' })

      await adminDb.connection.query(`
        CREATE POLICY "${updatePolicy}"
        ON storage.buckets
        AS PERMISSIVE
        FOR UPDATE
        TO authenticated
        USING (id = '${bucketId}')
        WITH CHECK (false)
      `)
      const updateResponse = await putLifecycle()

      expect(updateResponse.json()).toMatchObject({ code: 'AccessDenied' })
      expect(updateResponse.statusCode).toBe(400)
      await expect(adminDb.findLifecycleBucket(bucketId)).resolves.toMatchObject({
        lifecycle_configuration: null,
        lifecycle_configuration_generation: null,
      })
      await expect(adminDb.findBucketById(bucketId, 'updated_at')).resolves.toEqual(before)
    } finally {
      await adminDb.connection.query(`DROP POLICY IF EXISTS "${selectPolicy}" ON storage.buckets`)
      await adminDb.connection.query(`DROP POLICY IF EXISTS "${updatePolicy}" ON storage.buckets`)
    }
  })

  it.each([
    'PUT',
    'DELETE',
  ] as const)('checks the proposed lifecycle row against UPDATE policy for %s', async (method) => {
    const bucketId = `rest-lifecycle-with-check-${randomUUID()}`
    const policySuffix = randomUUID().replaceAll('-', '_')
    const selectPolicy = `lifecycle_select_${policySuffix}`
    const updatePolicy = `lifecycle_update_${policySuffix}`
    const restrictedToken = await signJWT(
      { role: 'authenticated', sub: randomUUID() },
      jwtSecret,
      '1h'
    )
    bucketIds.add(bucketId)
    await adminDb.createBucket({ id: bucketId, name: bucketId, public: false })
    if (method === 'DELETE') await adminDb.putLifecycleConfiguration(bucketId, { rules })

    try {
      await adminDb.connection.query(`
          CREATE POLICY "${selectPolicy}" ON storage.buckets
          FOR SELECT TO authenticated USING (id = '${bucketId}')
        `)
      await adminDb.connection.query(`
          CREATE POLICY "${updatePolicy}" ON storage.buckets
          FOR UPDATE TO authenticated USING (id = '${bucketId}')
          WITH CHECK (lifecycle_configuration IS NULL)
        `)

      const response = await appInstance.inject({
        method,
        url: `/bucket/${bucketId}/lifecycle`,
        headers: { authorization: `Bearer ${restrictedToken}` },
        ...(method === 'PUT' ? { payload: { rules } } : {}),
      })
      expect(response.statusCode).toBe(method === 'PUT' ? 400 : 200)
      if (method === 'PUT') expect(response.json()).toMatchObject({ code: 'AccessDenied' })
      await expect(adminDb.findLifecycleBucket(bucketId)).resolves.toMatchObject({
        lifecycle_configuration: null,
        lifecycle_configuration_generation: null,
      })
      if (method === 'PUT') {
        await adminDb.connection.query(`
          ALTER POLICY "${updatePolicy}" ON storage.buckets
          WITH CHECK (lifecycle_configuration IS NOT NULL)
        `)
        const allowed = await appInstance.inject({
          method: 'PUT',
          url: `/bucket/${bucketId}/lifecycle`,
          headers: { authorization: `Bearer ${restrictedToken}` },
          payload: { rules },
        })
        expect(allowed.statusCode).toBe(200)
        await expect(adminDb.findLifecycleBucket(bucketId)).resolves.toMatchObject({
          lifecycle_configuration: { rules },
          lifecycle_configuration_generation: expect.any(String),
        })
      }
    } finally {
      await adminDb.connection.query(`DROP POLICY IF EXISTS "${selectPolicy}" ON storage.buckets`)
      await adminDb.connection.query(`DROP POLICY IF EXISTS "${updatePolicy}" ON storage.buckets`)
    }
  })

  it('authorizes identical and reordered PUTs against the stored configuration and generation', async () => {
    const bucketId = `rest-lifecycle-retry-${randomUUID()}`
    const policySuffix = randomUUID().replaceAll('-', '_')
    const selectPolicy = `lifecycle_select_${policySuffix}`
    const updatePolicy = `lifecycle_update_${policySuffix}`
    const restrictedToken = await signJWT(
      { role: 'authenticated', sub: randomUUID() },
      jwtSecret,
      '1h'
    )
    bucketIds.add(bucketId)
    await adminDb.createBucket({ id: bucketId, name: bucketId, public: false })
    const initial = await adminDb.putLifecycleConfiguration(bucketId, { rules })
    const before = await adminDb.findBucketById(bucketId, 'updated_at')
    const put = (nextRules: typeof rules) =>
      appInstance.inject({
        method: 'PUT',
        url: `/bucket/${bucketId}/lifecycle`,
        headers: { authorization: `Bearer ${restrictedToken}` },
        payload: { rules: nextRules },
      })

    try {
      await adminDb.connection.query(`
        CREATE POLICY "${selectPolicy}" ON storage.buckets
        FOR SELECT TO authenticated USING (id = '${bucketId}')
      `)
      await adminDb.connection.query(`
        CREATE POLICY "${updatePolicy}" ON storage.buckets
        FOR UPDATE TO authenticated USING (id = '${bucketId}')
        WITH CHECK (
          lifecycle_configuration = '${JSON.stringify({ rules })}'::jsonb
          AND lifecycle_configuration_generation = '${initial.lifecycle_configuration_generation}'::uuid
        )
      `)
      for (const nextRules of [rules, [...rules].reverse()]) {
        const response = await put(nextRules)
        expect(response.statusCode).toBe(200)
        expect(response.json()).toEqual({ rules })
        await expect(adminDb.findLifecycleBucket(bucketId)).resolves.toEqual(initial)
        await expect(adminDb.findBucketById(bucketId, 'updated_at')).resolves.toEqual(before)
      }

      await adminDb.connection.query(`
        ALTER POLICY "${updatePolicy}" ON storage.buckets WITH CHECK (false)
      `)
      for (const nextRules of [rules, [...rules].reverse()]) {
        const denied = await put(nextRules)
        expect(denied.statusCode).toBe(400)
        expect(denied.json()).toMatchObject({ code: 'AccessDenied' })
        await expect(adminDb.findLifecycleBucket(bucketId)).resolves.toEqual(initial)
        await expect(adminDb.findBucketById(bucketId, 'updated_at')).resolves.toEqual(before)
      }
    } finally {
      await adminDb.connection.query(`DROP POLICY IF EXISTS "${selectPolicy}" ON storage.buckets`)
      await adminDb.connection.query(`DROP POLICY IF EXISTS "${updatePolicy}" ON storage.buckets`)
    }
  })

  it.each([
    'ANALYTICS',
    'VECTOR',
  ])('rejects lifecycle configuration for a %s bucket', async (type) => {
    const bucketId = `rest-lifecycle-${type.toLowerCase()}-${randomUUID()}`
    bucketIds.add(bucketId)
    await adminDb.createBucket({ id: bucketId, name: bucketId, public: false })
    await adminDb.connection.query(`UPDATE storage.buckets SET type = $2 WHERE id = $1`, [
      bucketId,
      type,
    ])

    const response = await appInstance.inject({
      method: 'PUT',
      url: `/bucket/${bucketId}/lifecycle`,
      headers: { authorization: `Bearer ${authorizationKey}` },
      payload: { rules },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      code: 'InvalidRequest',
      message: 'Versioning and lifecycle are only supported for Standard buckets',
    })

    const lifecycleRead = await appInstance.inject({
      method: 'GET',
      url: `/bucket/${bucketId}/lifecycle`,
      headers: { authorization: `Bearer ${authorizationKey}` },
    })
    expect(lifecycleRead.statusCode).toBe(400)
    expect(lifecycleRead.json()).toMatchObject({ code: 'InvalidRequest' })
  })
})
