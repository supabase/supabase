import { randomUUID } from 'node:crypto'
import { ROUTE_OPERATIONS } from '../http/routes/operations'
import { StoragePgDB } from '../storage/database'
import { useStorage, withDeleteEnabled } from './utils/storage'

describe('bucket lifecycle configuration persistence', () => {
  let currentOperation: string | undefined
  const helper = useStorage({ operation: () => currentOperation })
  let bucketId: string

  async function withOperation<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const previousOperation = currentOperation
    currentOperation = operation
    try {
      return await fn()
    } finally {
      currentOperation = previousOperation
    }
  }

  function putLifecycleConfiguration(
    configuration: Parameters<typeof helper.database.putLifecycleConfiguration>[1]
  ) {
    return helper.database.putLifecycleConfiguration(bucketId, configuration)
  }

  function deleteLifecycleConfiguration() {
    return helper.database.deleteLifecycleConfiguration(bucketId)
  }

  beforeEach(async () => {
    bucketId = `bucket-lifecycle-configuration-${randomUUID()}`
    await helper.database.createBucket({ id: bucketId, name: bucketId })
  })

  afterEach(async () => {
    await withDeleteEnabled(helper.database.connection, async (transaction) => {
      await transaction.query('DELETE FROM storage.objects WHERE bucket_id = $1', [bucketId])
      await transaction.query('DELETE FROM storage.buckets WHERE id = $1', [bucketId])
    })
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

  it('stores canonical policy state and preserves generation for an equivalent PUT', async () => {
    const first = await putLifecycleConfiguration({ rules })

    expect(first.lifecycle_configuration).toEqual({ rules })
    expect(first.lifecycle_configuration_generation).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i)
    const beforeRetry = await helper.database.findBucketById(bucketId, 'updated_at')

    const retry = await putLifecycleConfiguration({ rules })
    expect(retry.lifecycle_configuration_generation).toBe(first.lifecycle_configuration_generation)
    expect(retry.lifecycle_configuration?.rules).toEqual(rules)
    await expect(helper.database.findBucketById(bucketId, 'updated_at')).resolves.toEqual(
      beforeRetry
    )

    await expect(helper.database.findLifecycleBucket(bucketId)).resolves.toEqual(retry)
  })

  it('keeps stored order, generation and updated_at when rules are reordered', async () => {
    const first = await putLifecycleConfiguration({ rules })
    const beforeRetry = await helper.database.findBucketById(bucketId, 'updated_at')
    const reordered = { rules: [...rules].reverse() }

    await expect(putLifecycleConfiguration(reordered)).resolves.toEqual(first)
    await expect(helper.database.findLifecycleBucket(bucketId)).resolves.toEqual(first)
    await expect(putLifecycleConfiguration(reordered)).resolves.toEqual(first)
    await expect(helper.database.findBucketById(bucketId, 'updated_at')).resolves.toEqual(
      beforeRetry
    )
  })

  it('rotates generation only when canonical policy content changes', async () => {
    const first = await putLifecycleConfiguration({ rules })
    const replacement = await putLifecycleConfiguration({
      rules: [
        {
          ...rules[0],
          noncurrentVersionExpiration: { noncurrentDays: 60 },
        },
      ],
    })

    expect(replacement.lifecycle_configuration_generation).not.toBe(
      first.lifecycle_configuration_generation
    )
  })

  it.each([
    'missing generation',
    'reused generation',
    'generation-only change',
  ])('rejects a service-role policy update with %s without relying on an operation tag', async (change) => {
    const initial = await putLifecycleConfiguration({ rules })
    const transaction = await helper.database.connection.transaction()
    const configuration =
      change === 'generation-only change'
        ? { rules }
        : { rules: [{ ...rules[0], noncurrentVersionExpiration: { noncurrentDays: 31 } }] }
    const generation =
      change === 'missing generation'
        ? null
        : change === 'reused generation'
          ? initial.lifecycle_configuration_generation
          : randomUUID()

    try {
      await helper.database.connection.setScope(transaction)
      await expect(
        transaction.query(
          `UPDATE storage.buckets
         SET lifecycle_configuration = $2::jsonb, lifecycle_configuration_generation = $3::uuid
         WHERE id = $1`,
          [bucketId, JSON.stringify(configuration), generation]
        )
      ).rejects.toMatchObject({ code: '22023' })
    } finally {
      await transaction.rollback()
    }
    await expect(helper.database.findLifecycleBucket(bucketId)).resolves.toEqual(initial)
  })

  it('clears the policy pair and makes repeated deletion a no-op', async () => {
    await putLifecycleConfiguration({ rules })

    const deleted = await deleteLifecycleConfiguration()
    expect(deleted).toMatchObject({
      lifecycle_configuration: null,
      lifecycle_configuration_generation: null,
    })

    const beforeRetry = await helper.database.findBucketById(bucketId, 'updated_at')
    await expect(deleteLifecycleConfiguration()).resolves.toMatchObject({
      lifecycle_configuration: null,
      lifecycle_configuration_generation: null,
    })
    await expect(helper.database.findBucketById(bucketId, 'updated_at')).resolves.toEqual(
      beforeRetry
    )
  })

  it('supports direct lifecycle writes without an operation tag', async () => {
    const stored = await helper.database.putLifecycleConfiguration(bucketId, { rules })

    expect(stored.lifecycle_configuration).toEqual({ rules })
    await expect(helper.database.deleteLifecycleConfiguration(bucketId)).resolves.toMatchObject({
      lifecycle_configuration: null,
      lifecycle_configuration_generation: null,
    })
  })

  it('allows service-role writes under an unrelated operation without changing its value', async () => {
    const transaction = await helper.database.connection.transaction()
    const previousOperation = 'storage.object.get'

    try {
      await helper.database.connection.setScope(transaction)
      await transaction.query(`SELECT set_config('storage.operation', $1, true)`, [
        previousOperation,
      ])
      const transactionDatabase = new StoragePgDB(helper.database.connection, {
        tenantId: helper.database.tenantId,
        host: helper.database.tenantHost,
        latestMigration: 'validate-bucket-lifecycle-constraints',
        tnx: transaction,
      })

      await transactionDatabase.putLifecycleConfiguration(bucketId, { rules })

      await expect(
        transaction.query<{ operation: string }>(
          `SELECT current_setting('storage.operation', true) AS operation`
        )
      ).resolves.toMatchObject({ rows: [{ operation: previousOperation }] })
      await expect(
        transaction.query(
          `UPDATE storage.buckets
           SET lifecycle_configuration = $2::jsonb,
               lifecycle_configuration_generation = $3::uuid
           WHERE id = $1`,
          [
            bucketId,
            JSON.stringify({
              rules: [
                {
                  ...rules[0],
                  noncurrentVersionExpiration: { noncurrentDays: 31 },
                },
              ],
            }),
            randomUUID(),
          ]
        )
      ).resolves.toMatchObject({ rowCount: 1 })
      await expect(
        transaction.query(
          `UPDATE storage.buckets
           SET lifecycle_configuration = NULL, lifecycle_configuration_generation = NULL
           WHERE id = $1 RETURNING lifecycle_configuration, lifecycle_configuration_generation`,
          [bucketId]
        )
      ).resolves.toMatchObject({
        rows: [{ lifecycle_configuration: null, lifecycle_configuration_generation: null }],
      })
      await expect(
        transaction.query(`SELECT current_setting('storage.operation', true) AS operation`)
      ).resolves.toMatchObject({ rows: [{ operation: previousOperation }] })
    } finally {
      await transaction.rollback()
    }
  })

  it.each([
    {
      label: 'PUT',
      operation: ROUTE_OPERATIONS.S3_PUT_BUCKET_LIFECYCLE,
      prepare: async () => {},
      mutate: (database: StoragePgDB) => database.putLifecycleConfiguration(bucketId, { rules }),
    },
    {
      label: 'DELETE',
      operation: ROUTE_OPERATIONS.S3_DELETE_BUCKET_LIFECYCLE,
      prepare: () => putLifecycleConfiguration({ rules }),
      mutate: (database: StoragePgDB) => database.deleteLifecycleConfiguration(bucketId),
    },
  ])('keeps the exact S3 operation active during a lifecycle $label write', async (testCase) => {
    await testCase.prepare()
    const transaction = await helper.database.connection.transaction()
    const originalQuery = transaction.query.bind(transaction)
    let operationAtWrite: string | undefined
    const querySpy = vi
      .spyOn(transaction, 'query')
      .mockImplementation(async (statement, options) => {
        const text = typeof statement === 'string' ? statement : statement.text
        if (
          text.includes('UPDATE storage.buckets') &&
          text.includes('SET lifecycle_configuration')
        ) {
          const observed = await originalQuery<{ operation: string }>(
            `SELECT current_setting('storage.operation', true) AS operation`
          )
          operationAtWrite = observed.rows[0]?.operation
        }
        return originalQuery(statement, options)
      })

    try {
      await withOperation(testCase.operation, async () => {
        await helper.database.connection.setScope(transaction)
        const transactionDatabase = new StoragePgDB(helper.database.connection, {
          tenantId: helper.database.tenantId,
          host: helper.database.tenantHost,
          latestMigration: 'validate-bucket-lifecycle-constraints',
          tnx: transaction,
        })
        await testCase.mutate(transactionDatabase)
      })

      expect(operationAtWrite).toBe(testCase.operation)
    } finally {
      querySpy.mockRestore()
      await transaction.rollback()
    }
  })

  it('keeps the configuration pair null by default and enforces its database shape', async () => {
    const stored = await helper.database.connection.query<{
      lifecycle_configuration: unknown | null
      lifecycle_configuration_generation: string | null
    }>(
      `SELECT lifecycle_configuration, lifecycle_configuration_generation
       FROM storage.buckets
       WHERE id = $1`,
      [bucketId]
    )
    expect(stored.rows[0]).toEqual({
      lifecycle_configuration: null,
      lifecycle_configuration_generation: null,
    })

    const constraints = await helper.database.connection.query<{
      conname: string
      convalidated: boolean
    }>(
      `SELECT conname, convalidated
       FROM pg_catalog.pg_constraint
       WHERE conrelid = 'storage.buckets'::regclass
         AND conname = ANY($1::text[])
       ORDER BY conname`,
      [
        [
          'buckets_lifecycle_configuration_pair_check',
          'buckets_lifecycle_configuration_shape_check',
          'buckets_lifecycle_configuration_standard_only_check',
        ],
      ]
    )
    expect(constraints.rows).toEqual([
      {
        conname: 'buckets_lifecycle_configuration_pair_check',
        convalidated: true,
      },
      {
        conname: 'buckets_lifecycle_configuration_shape_check',
        convalidated: true,
      },
      {
        conname: 'buckets_lifecycle_configuration_standard_only_check',
        convalidated: true,
      },
    ])
  })

  it('rejects direct bucket-column writes and empty policies at the database boundary', async () => {
    const transaction = await helper.database.connection.transaction()
    try {
      await expect(
        transaction.query(
          `UPDATE storage.buckets
           SET lifecycle_configuration = $2::jsonb,
               lifecycle_configuration_generation = $3::uuid
           WHERE id = $1`,
          [bucketId, JSON.stringify({ rules }), randomUUID()]
        )
      ).rejects.toMatchObject({
        code: 'PST01',
        schema: 'storage',
        table: 'buckets',
        constraint: 'protect_bucket_control_update_role',
      })
    } finally {
      await transaction.rollback()
    }

    await expect(putLifecycleConfiguration({ rules: [] })).rejects.toMatchObject({
      code: 'DatabaseError',
      originalError: {
        code: '23514',
        constraint: 'buckets_lifecycle_configuration_shape_check',
      },
    })
  })

  it.each([
    'authenticated',
    'service_role',
  ])('uses the effective %s role for lifecycle writes from a different login', async (role) => {
    const probeLogin = `lifecycle_probe_${randomUUID().replaceAll('-', '_')}`
    const transaction = await helper.database.connection.transaction()

    try {
      await transaction.query(`CREATE ROLE ${probeLogin}`)
      await transaction.query(`GRANT ${role} TO ${probeLogin}`)
      await transaction.query(`
        CREATE POLICY "${probeLogin}_select" ON storage.buckets
        FOR SELECT TO ${role} USING (id = '${bucketId}')
      `)
      await transaction.query(`
        CREATE POLICY "${probeLogin}_update" ON storage.buckets
        FOR UPDATE TO ${role} USING (id = '${bucketId}') WITH CHECK (true)
      `)
      await transaction.query(`SET LOCAL SESSION AUTHORIZATION ${probeLogin}`)
      await transaction.query(`SET LOCAL ROLE ${role}`)
      const write = transaction.query(
        `UPDATE storage.buckets
         SET lifecycle_configuration = $2::jsonb,
             lifecycle_configuration_generation = $3::uuid
         WHERE id = $1 RETURNING lifecycle_configuration`,
        [bucketId, JSON.stringify({ rules }), randomUUID()]
      )
      if (role === 'authenticated') {
        await expect(write).rejects.toMatchObject({
          code: 'PST01',
          schema: 'storage',
          table: 'buckets',
          constraint: 'protect_bucket_control_update_role',
        })
      } else {
        await expect(write).resolves.toMatchObject({
          rows: [{ lifecycle_configuration: { rules } }],
        })
      }
    } finally {
      await transaction.rollback()
    }
    await expect(helper.database.findLifecycleBucket(bucketId)).resolves.toMatchObject({
      lifecycle_configuration: null,
      lifecycle_configuration_generation: null,
    })
  })

  it('allows lifecycle policy state on service-role bucket inserts', async () => {
    const transaction = await helper.database.connection.transaction()
    const generation = randomUUID()

    try {
      await helper.database.connection.setScope(transaction)
      await expect(
        transaction.query(
          `INSERT INTO storage.buckets (
             id, name, lifecycle_configuration, lifecycle_configuration_generation
           )
           VALUES ($1, $1, $2::jsonb, $3::uuid)
           RETURNING lifecycle_configuration, lifecycle_configuration_generation`,
          [`${bucketId}-service-role-insert`, JSON.stringify({ rules }), generation]
        )
      ).resolves.toMatchObject({
        rows: [
          { lifecycle_configuration: { rules }, lifecycle_configuration_generation: generation },
        ],
      })
    } finally {
      await transaction.rollback()
    }
  })

  it('allows a non-superuser service-role member to copy policies but not directly update them', async () => {
    const initial = await putLifecycleConfiguration({ rules })
    const probeRole = `lifecycle_copy_${randomUUID().replaceAll('-', '_')}`
    const copyId = `${bucketId}-copy`
    const transaction = await helper.database.connection.transaction()

    try {
      await transaction.query(`CREATE ROLE ${probeRole} NOSUPERUSER NOINHERIT NOBYPASSRLS`)
      await transaction.query(`GRANT service_role TO ${probeRole}`)
      await transaction.query(`GRANT USAGE ON SCHEMA storage TO ${probeRole}`)
      await transaction.query(`GRANT SELECT, INSERT, UPDATE ON storage.buckets TO ${probeRole}`)
      await transaction.query(`
        CREATE POLICY "${probeRole}" ON storage.buckets
        FOR ALL TO ${probeRole}
        USING (id IN ('${bucketId}', '${copyId}'))
        WITH CHECK (id IN ('${bucketId}', '${copyId}'))
      `)
      await transaction.query(`SET LOCAL SESSION AUTHORIZATION ${probeRole}`)
      await expect(
        transaction.query(`
          SELECT current_user AS role, rolsuper, rolbypassrls,
                 pg_has_role(current_user, 'service_role', 'MEMBER') AS member
          FROM pg_roles WHERE rolname = current_user
        `)
      ).resolves.toMatchObject({
        rows: [{ role: probeRole, rolsuper: false, rolbypassrls: false, member: true }],
      })
      await expect(
        transaction.query(
          `INSERT INTO storage.buckets (
             id, name, lifecycle_configuration, lifecycle_configuration_generation
           )
           SELECT $1, $1, lifecycle_configuration, lifecycle_configuration_generation
           FROM storage.buckets WHERE id = $2
           RETURNING lifecycle_configuration, lifecycle_configuration_generation`,
          [copyId, bucketId]
        )
      ).resolves.toMatchObject({
        rows: [
          {
            lifecycle_configuration: { rules },
            lifecycle_configuration_generation: initial.lifecycle_configuration_generation,
          },
        ],
      })
      await expect(
        transaction.query(
          `UPDATE storage.buckets
           SET lifecycle_configuration = NULL, lifecycle_configuration_generation = NULL
           WHERE id = $1`,
          [copyId]
        )
      ).rejects.toMatchObject({
        code: 'PST01',
        schema: 'storage',
        table: 'buckets',
        constraint: 'protect_bucket_control_update_role',
      })
    } finally {
      await transaction.rollback()
    }
  })

  it('uses the configured service-role argument for lifecycle inserts', async () => {
    const configuredRole = `lifecycle_service_${randomUUID().replaceAll('-', '_')}`
    const transaction = await helper.database.connection.transaction()

    try {
      await transaction.query(`CREATE ROLE ${configuredRole} NOSUPERUSER NOBYPASSRLS`)
      await transaction.query(`GRANT USAGE ON SCHEMA storage TO ${configuredRole}`)
      await transaction.query(`GRANT INSERT ON storage.buckets TO ${configuredRole}`)
      await transaction.query(`
        CREATE POLICY "${configuredRole}" ON storage.buckets
        FOR INSERT TO ${configuredRole} WITH CHECK (id = '${bucketId}-configured')
      `)
      await transaction.query(`DROP TRIGGER protect_bucket_control_insert ON storage.buckets`)
      await transaction.query(`
        CREATE TRIGGER protect_bucket_control_insert BEFORE INSERT ON storage.buckets
        FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns('${configuredRole}')
      `)
      await transaction.query(`SET LOCAL SESSION AUTHORIZATION ${configuredRole}`)
      await expect(
        transaction.query(`SELECT pg_has_role(current_user, 'service_role', 'MEMBER') AS member`)
      ).resolves.toMatchObject({ rows: [{ member: false }] })
      await expect(
        transaction.query(
          `INSERT INTO storage.buckets (
             id, name, lifecycle_configuration, lifecycle_configuration_generation
           ) VALUES ($1, $1, $2::jsonb, $3::uuid)`,
          [`${bucketId}-configured`, JSON.stringify({ rules }), randomUUID()]
        )
      ).resolves.toMatchObject({ rowCount: 1 })
    } finally {
      await transaction.rollback()
    }
  })

  it.each([
    'anon',
    'authenticated',
  ])('requires empty lifecycle state on %s bucket inserts', async (role) => {
    const transaction = await helper.database.connection.transaction()
    const policy = `lifecycle_insert_${randomUUID().replaceAll('-', '_')}`
    const insertedId = `${bucketId}-protected-insert`

    try {
      await transaction.query(`
        CREATE POLICY "${policy}" ON storage.buckets
        FOR INSERT TO ${role} WITH CHECK (id IN ('${insertedId}', '${insertedId}-empty'))
      `)
      await transaction.query(`SET LOCAL ROLE ${role}`)
      await expect(
        transaction.query(`SELECT pg_has_role(current_user, 'service_role', 'MEMBER') AS member`)
      ).resolves.toMatchObject({ rows: [{ member: false }] })
      await expect(
        transaction.query(`INSERT INTO storage.buckets (id, name) VALUES ($1, $1)`, [
          `${insertedId}-empty`,
        ])
      ).resolves.toMatchObject({ rowCount: 1 })
      await expect(
        transaction.query(
          `INSERT INTO storage.buckets (
             id, name, lifecycle_configuration, lifecycle_configuration_generation
           ) VALUES ($1, $1, $2::jsonb, $3::uuid)`,
          [insertedId, JSON.stringify({ rules }), randomUUID()]
        )
      ).rejects.toMatchObject({
        code: '42501',
        hint: 'Insert with both lifecycle columns NULL and configure lifecycle through the Storage API afterward, or insert as a member of service_role.',
      })
    } finally {
      await transaction.rollback()
    }
  })

  it.each([
    {
      label: 'missing generation',
      type: 'STANDARD',
      configuration: { rules },
      generation: null,
      constraint: 'buckets_lifecycle_configuration_pair_check',
    },
    {
      label: 'invalid rule array',
      type: 'STANDARD',
      configuration: { rules: [] },
      generation: randomUUID(),
      constraint: 'buckets_lifecycle_configuration_shape_check',
    },
    {
      label: 'non-Standard bucket',
      type: 'ANALYTICS',
      configuration: { rules },
      generation: randomUUID(),
      constraint: 'buckets_lifecycle_configuration_standard_only_check',
    },
  ])('retains the CHECK constraint for $label on service-role inserts', async ({
    type,
    configuration,
    generation,
    constraint,
  }) => {
    const transaction = await helper.database.connection.transaction()
    try {
      await helper.database.connection.setScope(transaction)
      await expect(
        transaction.query(
          `INSERT INTO storage.buckets (
             id, name, type, lifecycle_configuration, lifecycle_configuration_generation
           ) VALUES ($1, $1, $2, $3::jsonb, $4::uuid)`,
          [`${bucketId}-invalid-insert`, type, JSON.stringify(configuration), generation]
        )
      ).rejects.toMatchObject({ code: '23514', constraint })
    } finally {
      await transaction.rollback()
    }
  })

  it.each([
    'ANALYTICS',
    'VECTOR',
  ])('rejects lifecycle policy state for a resolved %s bucket', async (type) => {
    await helper.database.connection.query(`UPDATE storage.buckets SET type = $2 WHERE id = $1`, [
      bucketId,
      type,
    ])

    await expect(putLifecycleConfiguration({ rules })).rejects.toMatchObject({
      code: 'InvalidRequest',
      httpStatusCode: 400,
      message: 'Versioning and lifecycle are only supported for Standard buckets',
    })
    await expect(deleteLifecycleConfiguration()).rejects.toMatchObject({
      code: 'InvalidRequest',
      httpStatusCode: 400,
      message: 'Versioning and lifecycle are only supported for Standard buckets',
    })

    await expect(
      helper.database.connection.query(
        `UPDATE storage.buckets
         SET lifecycle_configuration = '{"rules": []}'::jsonb,
             lifecycle_configuration_generation = $2::uuid
         WHERE id = $1`,
        [bucketId, randomUUID()]
      )
    ).rejects.toMatchObject({ code: '0A000' })
  })
})
