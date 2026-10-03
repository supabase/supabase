import { hashStringToInt } from '@internal/hashing'
import { getConfig } from '../../../config'
import type { DatabaseTransaction, DatabaseTransactionalExecutor } from '../../database/connection'
import { logger, logSchema } from '../../monitoring'
import { JWKSManagerStore, JWKStoreItem, PaginatedTenantItem } from './store'

const { multitenantDatabaseQueryTimeout } = getConfig()

export class JWKSManagerStorePg implements JWKSManagerStore<DatabaseTransaction> {
  constructor(private db: DatabaseTransactionalExecutor) {}

  async transaction<T>(callback: (trx: DatabaseTransaction) => Promise<T>): Promise<T> {
    const trx = await this.db.beginTransaction()

    try {
      const result = await callback(trx)
      await trx.commit()
      return result
    } catch (e) {
      try {
        await trx.rollback()
      } catch (rollbackError) {
        logSchema.warning(logger, '[JWKSManagerStorePg] Failed to rollback transaction', {
          type: 'db',
          error: rollbackError,
          metadata: JSON.stringify({ originalError: String(e) }),
        })
      }
      throw e
    }
  }

  async insert(
    tenantId: string,
    encryptedJwk: string,
    kind: string,
    idempotent = false,
    trx?: DatabaseTransaction
  ): Promise<string> {
    const db = trx || this.db
    const insertResult = await db.query<{ id: string }>(
      {
        text: `
          INSERT INTO tenants_jwks (
            tenant_id,
            content,
            kind,
            active
          )
          VALUES ($1, $2, $3, true)
          ${idempotent ? 'ON CONFLICT DO NOTHING' : ''}
          RETURNING id
        `,
        values: [tenantId, encryptedJwk, kind],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )

    if (insertResult.rows.length > 0) {
      return insertResult.rows[0].id
    }

    if (!idempotent) {
      throw new Error('failed to insert jwk')
    }

    const result = await db.query<{ id: string }>(
      {
        text: `
          SELECT id
          FROM tenants_jwks
          WHERE tenant_id = $1
            AND kind = $2
            AND active = true
          LIMIT 1
        `,
        values: [tenantId, kind],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )

    if (!result.rows[0]?.id) {
      throw new Error('failed to find existing jwk on idempotent insert')
    }

    return result.rows[0].id
  }

  async swapStandbyActiveKey(
    tenantId: string,
    targetId: string,
    activeKind: string,
    standbyKind: string,
    trx?: DatabaseTransaction
  ): Promise<{ swapped: boolean; demotedId: string | null }> {
    const runSwap = async (db: DatabaseTransaction) => {
      // Serializes concurrent swaps of this tenant's active slot, so two swaps can never both
      // pass the check below and race to promote (which would violate the unique index).
      await this.lockKeyByKind(db, tenantId, activeKind)

      // Confirm the target is really an active standby-kind key, and lock it
      const target = await db.query<{ id: string }>(
        {
          text: `
            SELECT id
            FROM tenants_jwks
            WHERE id = $1
              AND tenant_id = $2
              AND kind = $3
              AND active = true
            FOR UPDATE
          `,
          values: [targetId, tenantId, standbyKind],
        },
        { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
      )

      if (target.rowCount === 0) {
        return { swapped: false, demotedId: null }
      }

      // Demote the current active key before promoting the target, so both are never
      // simultaneously active under activeKind
      const demoted = await db.query<{ id: string }>(
        {
          text: `
            UPDATE tenants_jwks
            SET kind = $3
            WHERE tenant_id = $1
              AND kind = $2
              AND active = true
            RETURNING id
          `,
          values: [tenantId, activeKind, standbyKind],
        },
        { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
      )

      // Promote the standby key to the active url signing key
      await db.query(
        {
          text: `
            UPDATE tenants_jwks
            SET kind = $3
            WHERE tenant_id = $2
              AND id = $1
          `,
          values: [targetId, tenantId, activeKind],
        },
        { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
      )

      return { swapped: true, demotedId: demoted.rows[0]?.id ?? null }
    }

    if (trx) {
      return runSwap(trx)
    }
    return this.transaction(runSwap)
  }

  async getById(
    tenantId: string,
    id: string,
    trx?: DatabaseTransaction
  ): Promise<JWKStoreItem | undefined> {
    const db = trx || this.db
    const result = await db.query<JWKStoreItem>(
      {
        text: `
          SELECT id, kind, content, active
          FROM tenants_jwks
          WHERE tenant_id = $1
            AND id = $2
        `,
        values: [tenantId, id],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )

    return result.rows[0]
  }

  async toggleActive(
    tenantId: string,
    id: string,
    newState: boolean,
    excludeKind: string | null,
    trx?: DatabaseTransaction
  ): Promise<boolean> {
    const db = trx || this.db
    const result = await db.query(
      {
        text: `
          UPDATE tenants_jwks
          SET active = $1
          WHERE id = $2
            AND tenant_id = $3
            AND active = $4
            AND ($5::text IS NULL OR kind != $5)
        `,
        values: [newState, id, tenantId, !newState, excludeKind],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )

    return Boolean(result.rowCount && result.rowCount > 0)
  }

  async listActive(
    tenantId: string,
    kind?: string,
    trx?: DatabaseTransaction
  ): Promise<JWKStoreItem[]> {
    const db = trx || this.db
    const result = await db.query<JWKStoreItem>(
      {
        text: `
          SELECT id, kind, content, active
          FROM tenants_jwks
          WHERE tenant_id = $1
            AND active = true
            AND ($2::text IS NULL OR kind = $2)
        `,
        values: [tenantId, kind || null],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )

    return result.rows
  }

  async list(tenantId: string, trx?: DatabaseTransaction): Promise<JWKStoreItem[]> {
    const db = trx || this.db
    const result = await db.query<JWKStoreItem>(
      {
        text: `
          SELECT id, kind, content, active
          FROM tenants_jwks
          WHERE tenant_id = $1
        `,
        values: [tenantId],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )

    return result.rows
  }

  async listTenantsWithoutKindPaginated(
    kind: string,
    batchSize: number,
    lastCursor = 0
  ): Promise<PaginatedTenantItem[]> {
    const result = await this.db.query<PaginatedTenantItem>(
      {
        text: `
          SELECT id, cursor_id
          FROM tenants
          WHERE cursor_id > $1
            AND NOT EXISTS (
              SELECT 1
              FROM tenants_jwks
              WHERE tenants_jwks.tenant_id = tenants.id
                AND tenants_jwks.kind = $2
                AND tenants_jwks.active = true
            )
          ORDER BY cursor_id ASC
          LIMIT $3
        `,
        values: [lastCursor, kind, batchSize],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )

    return result.rows
  }

  private async lockKeyByKind(
    db: DatabaseTransaction,
    tenantId: string,
    kind: string
  ): Promise<void> {
    await db.query(
      {
        text: 'SELECT pg_advisory_xact_lock($1::bigint)',
        values: [String(hashStringToInt(`jwks-swap:${tenantId}:${kind}`))],
      },
      { signal: AbortSignal.timeout(multitenantDatabaseQueryTimeout) }
    )
  }
}
