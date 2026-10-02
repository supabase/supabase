import { JWKSManagerStorePg } from '@internal/auth/jwks'
import { PgPoolExecutor } from '@internal/database'
import { logger, logSchema } from '@internal/monitoring'
import { Pool } from 'pg'
import { getConfig } from '../config'
import { runMultitenantMigrations } from '../internal/database/migrations'

const { databaseApplicationName, multitenantDatabaseUrl } = getConfig()

const tenantId = 'pg-store-jwks'
const tenantWithoutKindId = 'pg-store-jwks-missing-kind'

describe('JWKSManagerStorePg', () => {
  let pool: Pool
  let executor: PgPoolExecutor
  let store: JWKSManagerStorePg

  beforeAll(async () => {
    await runMultitenantMigrations()

    pool = new Pool({
      connectionString: multitenantDatabaseUrl,
      application_name: databaseApplicationName,
      max: 2,
      min: 0,
    })
    executor = new PgPoolExecutor(pool)
    store = new JWKSManagerStorePg(executor)
  })

  beforeEach(async () => {
    await executor.query({
      text: `
        INSERT INTO tenants (
          id,
          anon_key,
          database_url,
          jwt_secret,
          service_key
        )
        VALUES
          ($1, 'anon', 'postgres://tenant', 'jwt-secret', 'service-key'),
          ($2, 'anon', 'postgres://tenant', 'jwt-secret', 'service-key')
        ON CONFLICT (id) DO NOTHING
      `,
      values: [tenantId, tenantWithoutKindId],
    })
  })

  afterEach(async () => {
    await executor.query({
      text: 'DELETE FROM tenants WHERE id = ANY($1::text[])',
      values: [[tenantId, tenantWithoutKindId]],
    })
  })

  afterAll(async () => {
    await pool.end()
  })

  it('implements insert, listActive, and toggleActive', async () => {
    const id = await store.insert(tenantId, 'encrypted-content', 'custom-kind')

    await expect(store.listActive(tenantId)).resolves.toEqual([
      {
        id,
        kind: 'custom-kind',
        content: 'encrypted-content',
        active: true,
      },
    ])

    await expect(store.listActive(tenantId, 'other-kind')).resolves.toEqual([])
    await expect(store.toggleActive(tenantId, id, false, null)).resolves.toBe(true)
    await expect(store.toggleActive(tenantId, id, false, null)).resolves.toBe(false)
    await expect(store.listActive(tenantId)).resolves.toEqual([])
    await expect(store.toggleActive(tenantId, id, true, null)).resolves.toBe(true)
    await expect(store.listActive(tenantId, 'custom-kind')).resolves.toHaveLength(1)
  })

  it('refuses to toggle a jwk whose kind matches excludeKind', async () => {
    const id = await store.insert(tenantId, 'active-content', 'guarded-kind')

    await expect(store.toggleActive(tenantId, id, false, 'guarded-kind')).resolves.toBe(false)
    await expect(store.listActive(tenantId, 'guarded-kind')).resolves.toEqual([
      { id, kind: 'guarded-kind', content: 'active-content', active: true },
    ])

    // a different excludeKind (or none) does not block the toggle
    await expect(store.toggleActive(tenantId, id, false, 'other-kind')).resolves.toBe(true)
  })

  it('implements list, including inactive jwks', async () => {
    const activeId = await store.insert(tenantId, 'active-content', 'list-active-kind')
    const inactiveId = await store.insert(tenantId, 'inactive-content', 'list-inactive-kind')
    await store.toggleActive(tenantId, inactiveId, false, null)

    const all = await store.list(tenantId)
    const relevant = all.filter((item) => item.id === activeId || item.id === inactiveId)

    expect(relevant).toEqual(
      expect.arrayContaining([
        { id: activeId, kind: 'list-active-kind', content: 'active-content', active: true },
        { id: inactiveId, kind: 'list-inactive-kind', content: 'inactive-content', active: false },
      ])
    )
  })

  it('list returns an empty array for a tenant with no jwks', async () => {
    await expect(store.list(tenantWithoutKindId)).resolves.toEqual([])
  })

  it('swaps a standby jwk to become the active kind and demotes the previous active jwk', async () => {
    const activeId = await store.insert(tenantId, 'active-content', 'swap-active-kind')
    const standbyId = await store.insert(tenantId, 'standby-content', 'swap-standby-kind')

    await expect(
      store.swapStandbyActiveKey(tenantId, standbyId, 'swap-active-kind', 'swap-standby-kind')
    ).resolves.toEqual({ swapped: true, demotedId: activeId })

    await expect(store.listActive(tenantId, 'swap-active-kind')).resolves.toEqual([
      { id: standbyId, kind: 'swap-active-kind', content: 'standby-content', active: true },
    ])
    await expect(store.listActive(tenantId, 'swap-standby-kind')).resolves.toEqual([
      { id: activeId, kind: 'swap-standby-kind', content: 'active-content', active: true },
    ])
  })

  it('swaps back and forth repeatedly without violating the active-signing-key unique index', async () => {
    const activeId = await store.insert(tenantId, 'active-content', 'storage-url-signing-key')
    const standbyId = await store.insert(tenantId, 'standby-content', 'storage-url-standby-key')

    for (let i = 0; i < 5; i++) {
      const target = i % 2 === 0 ? standbyId : activeId
      const expectedDemoted = i % 2 === 0 ? activeId : standbyId
      await expect(
        store.swapStandbyActiveKey(
          tenantId,
          target,
          'storage-url-signing-key',
          'storage-url-standby-key'
        )
      ).resolves.toEqual({ swapped: true, demotedId: expectedDemoted })
    }

    // 5 swaps starting from standbyId -> standbyId ends up active
    await expect(store.listActive(tenantId, 'storage-url-signing-key')).resolves.toEqual([
      { id: standbyId, kind: 'storage-url-signing-key', content: 'standby-content', active: true },
    ])
    await expect(store.listActive(tenantId, 'storage-url-standby-key')).resolves.toEqual([
      { id: activeId, kind: 'storage-url-standby-key', content: 'active-content', active: true },
    ])
  })

  it('swap promotes a standby jwk even when no active jwk currently exists', async () => {
    const standbyId = await store.insert(tenantId, 'standby-only-content', 'lone-standby-kind')

    await expect(
      store.swapStandbyActiveKey(tenantId, standbyId, 'lone-active-kind', 'lone-standby-kind')
    ).resolves.toEqual({ swapped: true, demotedId: null })

    await expect(store.listActive(tenantId, 'lone-active-kind')).resolves.toEqual([
      { id: standbyId, kind: 'lone-active-kind', content: 'standby-only-content', active: true },
    ])
  })

  it('swap is a no-op when the target id does not match any jwk', async () => {
    await expect(
      store.swapStandbyActiveKey(
        tenantId,
        '00000000-0000-0000-0000-000000000000',
        'missing-active-kind',
        'missing-standby-kind'
      )
    ).resolves.toEqual({ swapped: false, demotedId: null })
  })

  it('swap does not demote the active key when the target id does not exist', async () => {
    const activeId = await store.insert(tenantId, 'active-content', 'guard-active-kind')

    await expect(
      store.swapStandbyActiveKey(
        tenantId,
        '00000000-0000-0000-0000-000000000000',
        'guard-active-kind',
        'guard-standby-kind'
      )
    ).resolves.toEqual({ swapped: false, demotedId: null })

    await expect(store.listActive(tenantId, 'guard-active-kind')).resolves.toEqual([
      { id: activeId, kind: 'guard-active-kind', content: 'active-content', active: true },
    ])
  })

  it('swap does not promote a jwk whose kind does not match the expected standby kind', async () => {
    const activeId = await store.insert(tenantId, 'active-content', 'mismatch-active-kind')
    const unrelatedId = await store.insert(tenantId, 'unrelated-content', 'unrelated-kind')

    await expect(
      store.swapStandbyActiveKey(
        tenantId,
        unrelatedId,
        'mismatch-active-kind',
        'mismatch-standby-kind'
      )
    ).resolves.toEqual({ swapped: false, demotedId: null })

    await expect(store.listActive(tenantId, 'mismatch-active-kind')).resolves.toEqual([
      { id: activeId, kind: 'mismatch-active-kind', content: 'active-content', active: true },
    ])
    await expect(store.listActive(tenantId, 'unrelated-kind')).resolves.toEqual([
      { id: unrelatedId, kind: 'unrelated-kind', content: 'unrelated-content', active: true },
    ])
  })

  it('returns the existing row for idempotent active url signing key inserts', async () => {
    const firstId = await store.insert(
      tenantId,
      'first-encrypted-content',
      'storage-url-signing-key',
      true
    )
    const secondId = await store.insert(
      tenantId,
      'second-encrypted-content',
      'storage-url-signing-key',
      true
    )

    expect(secondId).toBe(firstId)
    await expect(store.listActive(tenantId, 'storage-url-signing-key')).resolves.toEqual([
      {
        id: firstId,
        kind: 'storage-url-signing-key',
        content: 'first-encrypted-content',
        active: true,
      },
    ])
  })

  it('rolls back transaction work when the callback fails', async () => {
    await expect(
      store.transaction(async (trx) => {
        await store.insert(tenantId, 'transaction-content', 'transaction-kind', false, trx)
        throw new Error('rollback requested')
      })
    ).rejects.toThrow('rollback requested')

    await expect(store.listActive(tenantId, 'transaction-kind')).resolves.toEqual([])
  })

  it('preserves transaction callback errors when rollback fails', async () => {
    const originalError = new Error('transaction failed')
    const rollbackError = new Error('rollback failed')
    const trx = {
      commit: vi.fn().mockResolvedValue(undefined),
      rollback: vi.fn().mockRejectedValue(rollbackError),
    }
    const storage = new JWKSManagerStorePg({
      beginTransaction: vi.fn().mockResolvedValue(trx),
    } as never)
    const logSpy = vi.spyOn(logSchema, 'warning').mockImplementation(() => undefined)

    try {
      await expect(
        storage.transaction(async () => {
          throw originalError
        })
      ).rejects.toBe(originalError)

      expect(trx.rollback).toHaveBeenCalledTimes(1)
      expect(logSpy).toHaveBeenCalledWith(
        logger,
        '[JWKSManagerStorePg] Failed to rollback transaction',
        expect.objectContaining({
          type: 'db',
          error: rollbackError,
        })
      )
    } finally {
      logSpy.mockRestore()
    }
  })

  it('commits transaction work when the callback succeeds', async () => {
    const id = await store.transaction((trx) => {
      return store.insert(tenantId, 'committed-content', 'committed-kind', false, trx)
    })

    await expect(store.listActive(tenantId, 'committed-kind')).resolves.toEqual([
      {
        id,
        kind: 'committed-kind',
        content: 'committed-content',
        active: true,
      },
    ])
  })

  it('lists tenants missing a specific active jwk kind', async () => {
    await store.insert(tenantId, 'present-content', 'present-kind')

    const tenants = await store.listTenantsWithoutKindPaginated('present-kind', 100)
    const tenantIds = tenants.map((tenant) => tenant.id)

    expect(tenantIds).toContain(tenantWithoutKindId)
    expect(tenantIds).not.toContain(tenantId)
  })
})
