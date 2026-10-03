import { getTenantConfig } from '@internal/database'
import { runMigrationsOnTenant } from '@internal/database/migrations'
import { logger, logSchema } from '@internal/monitoring'
import type { Storage } from '@storage/storage'
import { getConfig } from '../../../config'
import { UpgradeBaseEvent, UpgradeBaseEventPayload, UpgradeTransaction } from './base-event'

type SyncCatalogIdsPayload = UpgradeBaseEventPayload

const { icebergShards } = getConfig()

export class SyncCatalogIds extends UpgradeBaseEvent<SyncCatalogIdsPayload> {
  static queueName = 'sync-iceberg-catalog-ids'

  static async handleUpgrade(tnx: UpgradeTransaction) {
    const tenantCatalogs = await listTenantCatalogs(tnx)

    let updatedCount = 0
    let hardFail: unknown | undefined = undefined

    logSchema.info(
      logger,
      `[Upgrade][SyncCatalogIds] Found ${tenantCatalogs.length} catalogs to sync IDs for`,
      {
        type: 'upgradeEvent',
      }
    )

    await Promise.all(
      tenantCatalogs.map(async (catalog) => {
        let storage: Storage | undefined

        try {
          const config = await getTenantConfig(catalog.tenant_id)

          await runMigrationsOnTenant({
            tenantId: catalog.tenant_id,
            databaseUrl: config.databaseUrl,
            waitForLock: true,
          })

          storage = await this.createStorage({
            tenant: {
              ref: catalog.tenant_id,
              host: '',
            },
          })

          const tenantBuckets = await storage.listAnalyticsBuckets('id,name', {
            limit: 1000,
          })

          logSchema.info(
            logger,
            `[Upgrade][SyncCatalogIds] Found ${tenantBuckets.length} buckets to sync for tenant ${catalog.tenant_id}`,
            {
              type: 'upgradeEvent',
            }
          )

          if (hardFail) {
            throw hardFail
          }

          try {
            for (const bucket of tenantBuckets) {
              const updated = await updateCatalogId(tnx, {
                catalogId: bucket.id,
                name: bucket.name,
                tenantId: catalog.tenant_id,
                updatedAt: new Date(),
              })

              logSchema.info(
                logger,
                `[Upgrade][SyncCatalogIds] Updated ${updated.length} records for bucket ${bucket.name} for tenant_id ${catalog.tenant_id} using catalog-id ${bucket.id}`,
                {
                  type: 'upgradeEvent',
                }
              )

              if (updated.length === 0) {
                // insert catalog if it does not exist
                await insertCatalog(tnx, {
                  catalogId: bucket.id,
                  name: bucket.name,
                  tenantId: catalog.tenant_id,
                  timestamp: new Date(),
                })
              }

              updatedCount += updated.length
            }
          } catch (e) {
            logSchema.error(
              logger,
              `[Upgrade][SyncCatalogIds] Failed to update bucket for ${catalog.tenant_id}`,
              {
                type: 'upgradeEvent',
                error: e,
              }
            )

            if (hardFail) {
              hardFail = e
            }
            throw e
          }
        } catch (e) {
          // no-op
          logSchema.error(
            logger,
            `[Upgrade][SyncCatalogIds] Error interacting with tenant ${catalog.tenant_id}, skipping...`,
            {
              error: e,
              type: 'upgradeEvent',
            }
          )
        } finally {
          if (storage) {
            storage.db.destroyConnection()
          }
        }
      })
    )

    if (hardFail) {
      throw hardFail
    }

    if (updatedCount > 0) {
      await this.refillShards(tnx)
    }

    logSchema.info(logger, `[Upgrade][SyncCatalogIds] Completed updated ${updatedCount} catalogs`, {
      type: 'upgradeEvent',
    })
  }

  protected static async refillShards(tnx: UpgradeTransaction) {
    if (icebergShards.length === 0) {
      return
    }

    await tnx.query(`DELETE FROM shard_reservation where resource_id LIKE 'iceberg-table::%'`)
    await tnx.query(`DELETE FROM shard_slots where resource_id LIKE 'iceberg-table::%'`)

    await tnx.query(refillShardsQuery())
  }
}

type TenantCatalogRow = { tenant_id: string; catalog_names: string[] }
type UpdatedCatalogRow = { id: string }

async function listTenantCatalogs(tnx: UpgradeTransaction): Promise<TenantCatalogRow[]> {
  const result = await tnx.query<TenantCatalogRow>(`
    SELECT tenant_id, ARRAY_AGG(name) AS catalog_names
    FROM iceberg_catalogs
    GROUP BY tenant_id
  `)

  return result.rows
}

async function updateCatalogId(
  tnx: UpgradeTransaction,
  params: {
    catalogId: string
    name: string
    tenantId: string
    updatedAt: Date
  }
): Promise<UpdatedCatalogRow[]> {
  const result = await tnx.query<UpdatedCatalogRow>({
    text: `
      UPDATE iceberg_catalogs
      SET id = $1, updated_at = $2
      WHERE tenant_id = $3
        AND name = $4
        AND deleted_at IS NULL
      RETURNING id
    `,
    values: [params.catalogId, params.updatedAt, params.tenantId, params.name],
  })

  return result.rows
}

async function insertCatalog(
  tnx: UpgradeTransaction,
  params: {
    catalogId: string
    name: string
    tenantId: string
    timestamp: Date
  }
): Promise<void> {
  await tnx.query({
    text: `
      INSERT INTO iceberg_catalogs (id, name, tenant_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
    `,
    values: [params.catalogId, params.name, params.tenantId, params.timestamp, params.timestamp],
  })
}

export function refillShardsQuery(): string {
  return `
        WITH all_iceberg_tables as (
            SELECT t.id, t.tenant_id, t.name, s.shard_key, s.id AS shard_id, t.namespace_id, t.catalog_id, row_number() OVER (PARTITION BY s.id ORDER BY t.id) - 1 as slot_no
            FROM iceberg_tables t
            JOIN shard s ON s.kind = 'iceberg-table' AND s.shard_key = t.shard_key
        ),
        set_shard_reservation AS (
             INSERT INTO shard_reservation (tenant_id, shard_id, kind, resource_id, lease_expires_at, slot_no, status)
                 SELECT it.tenant_id, it.shard_id, 'iceberg-table', ('iceberg-table::' || it.catalog_id || '::' || it.namespace_id || '/' || it.name), now() + interval '5 minutes', it.slot_no, 'confirmed'
                 FROM all_iceberg_tables it
         ),
         shard_slot AS (
             INSERT INTO shard_slots (tenant_id, shard_id, resource_id, slot_no)
                 SELECT it.tenant_id, it.shard_id, ('iceberg-table::' || it.catalog_id || '::' || it.namespace_id || '/' || it.name), it.slot_no
                 FROM all_iceberg_tables it
                 RETURNING shard_id, slot_no
         ),
         shard_next_slot AS (
             SELECT s.id AS shard_id, COALESCE(MAX(shard_slot.slot_no) + 1, 0) AS next_slot
             FROM shard s
             LEFT JOIN shard_slot ON shard_slot.shard_id = s.id
             WHERE s.kind = 'iceberg-table'
             GROUP BY s.id
         )
        UPDATE shard
        SET next_slot = shard_next_slot.next_slot
        FROM shard_next_slot
        WHERE shard.id = shard_next_slot.shard_id;
    `
}
