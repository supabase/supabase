import { type DatabaseTransaction, multitenantPgExecutor } from '@internal/database'
import { logger, logSchema } from '@internal/monitoring'
import { PgShardStoreFactory, ShardCatalog, ShardRow } from '@internal/sharding'
import {
  ListTableResponse,
  RestCatalogClient,
} from '@storage/protocols/iceberg/catalog/rest-catalog-client'
import { TableIndex } from '@storage/protocols/iceberg/metastore'
import { IcebergCatalog } from '@storage/schemas'

type NamespaceWithShardInfo = TableIndex & { shard_id?: string; shard_key?: string }
type CatalogRow = Pick<IcebergCatalog, 'id' | 'name'>
type ReconcilerTransaction = DatabaseTransaction

/**
 * Highly experimental reconciler for iceberg catalogs
 * It will try to ensure that the local database and the upstream catalog
 * are in sync, by performing the following actions:
 * - Deleting local tables that do not exist upstream
 * - Creating local tables for upstream tables that do not exist locally
 * - Deleting upstream namespaces that are empty
 */
export class IcebergCatalogReconciler {
  constructor(private readonly restCatalog: RestCatalogClient) {}

  async reconcile() {
    const namespaces = await this.listNamespacesWithShardInfo()

    await this.syncOrphanTables()
    await this.deleteUpstreamEmptyNamespaces(namespaces)
  }

  private async syncOrphanTables() {
    const sharding = this.createShardCatalog()
    const shards = await sharding.listShardByKind('iceberg-table')

    await Promise.allSettled(
      shards.map(async (shard) => {
        const namespaces = this.listNamespaces(shard.shard_key)

        for await (const nsBatch of namespaces) {
          for (const namespace of nsBatch) {
            const tables = this.listTables(namespace[0], shard.shard_key)

            for await (const tableBatch of tables) {
              const tenantId = namespace[0].split('_').shift()
              if (!tenantId) {
                continue
              }
              const dbNamespaceId = namespace[0].split('_').slice(1).join('-')
              if (!dbNamespaceId) {
                continue
              }

              const dbTables = await this.listDbTablesForBatch(
                dbNamespaceId,
                shard.shard_key,
                tableBatch.map((t) => t.name)
              )

              await Promise.allSettled([
                this.deleteLocalOrphanTables(shard, dbTables, tableBatch),
                this.syncUpstreamOrphanTables(shard, tenantId, dbNamespaceId, dbTables, tableBatch),
              ])
            }
          }
        }
      })
    )
  }

  private async deleteLocalOrphanTables(
    shard: ShardRow,
    dbTables: TableIndex[],
    tableBatch: ListTableResponse['identifiers']
  ) {
    const tablesToDeleteInDb = dbTables.filter(
      (dbt) => !tableBatch.find((t) => t.name === dbt.name)
    )

    if (tablesToDeleteInDb.length === 0) {
      return
    }

    await multitenantPgExecutor.query({
      text: `
        DELETE FROM iceberg_tables
        WHERE name = ANY($1::text[])
          AND shard_key = $2
      `,
      values: [tablesToDeleteInDb.map((t) => t.name), shard.shard_key],
    })
  }

  private async syncUpstreamOrphanTables(
    shard: ShardRow,
    tenantId: string,
    namespaceId: string,
    dbTables: TableIndex[],
    tableBatch: ListTableResponse['identifiers']
  ) {
    const shardCatalog = this.createShardCatalog()
    // Find tables that are in the catalog but not in the database
    const tablesMissing = tableBatch.filter((t) => !dbTables.find((dbt) => dbt.name === t.name))

    if (tablesMissing.length === 0) {
      return
    }

    await this.withTransaction(async (tnx) => {
      await Promise.all(
        tablesMissing.map(async (table) => {
          const namespaceResp = await this.restCatalog.loadNamespaceMetadata({
            warehouse: shard.shard_key,
            namespace: table.namespace[0],
          })

          const tableResp = await this.restCatalog.loadTable({
            warehouse: shard.shard_key,
            namespace: table.namespace[0],
            table: table.name,
          })

          let catalogName = namespaceResp.properties?.['bucket-name'] as string | undefined
          let catalog = catalogName
            ? await this.findCatalogByName(tnx, tenantId, catalogName)
            : undefined

          if (!catalog) {
            catalog = await this.findFirstCatalog(tnx, tenantId)

            if (!catalog) {
              // There is no catalog in the user database, meaning that the only thing we can do
              // is delete the table from the upstream catalog
              await this.restCatalog.dropTable({
                warehouse: shard.shard_key,
                namespace: table.namespace[0],
                table: table.name,
              })

              // Also special case here, since the tenant has no catalog, we can free up the shard slots
              await this.clearTenantShardSlots(tnx, shard.id, tenantId)
              return
            }

            catalogName = catalog.name
          }

          const sharder = shardCatalog.withTnx(tnx)
          const existingShard = await sharder.findShardByResourceId({
            kind: 'iceberg-table',
            tenantId,
            bucketName: catalog.name,
            logicalName: `${namespaceId}/${table.name}`,
          })

          if (!existingShard) {
            // Reserve a shard for this table
            const { reservationId } = await sharder.reserve({
              kind: 'iceberg-table',
              tenantId,
              bucketName: catalog.name,
              logicalName: `${namespaceId}/${table.name}`,
              shardId: shard.id,
            })

            await sharder.confirm(reservationId, {
              kind: 'iceberg-table',
              tenantId,
              bucketName: catalog.name,
              logicalName: `${namespaceId}/${table.name}`,
            })
          }

          await this.insertIcebergTable(tnx, {
            name: table.name,
            namespace_id: namespaceId,
            location: tableResp.metadata.location as string,
            catalog_id: catalog.id,
            bucket_name: catalog.name,
            tenant_id: tenantId,
            shard_id: shard.id,
            shard_key: shard.shard_key,
            remote_table_id: tableResp.metadata['table-uuid'],
          })
        })
      )
    })
  }

  private async deleteUpstreamEmptyNamespaces(namespaces: NamespaceWithShardInfo[]) {
    await Promise.allSettled(
      namespaces.map(async (namespace) => {
        const namespaceName = `${namespace.tenant_id}_${namespace.id.replaceAll('-', '_')}`

        if (!namespace.shard_key) {
          return
        }

        const tables = await this.restCatalog.listTables({
          namespace: namespaceName,
          pageSize: 1,
          warehouse: namespace.shard_key,
        })

        if (tables.identifiers.length === 0) {
          await this.restCatalog.dropNamespace({
            namespace: namespaceName,
            warehouse: namespace.shard_key,
          })
        }
      })
    )
  }

  private createShardCatalog() {
    return new ShardCatalog(new PgShardStoreFactory(multitenantPgExecutor))
  }

  private async listNamespacesWithShardInfo(): Promise<NamespaceWithShardInfo[]> {
    const result = await multitenantPgExecutor.query<NamespaceWithShardInfo>(`
      SELECT DISTINCT
        iceberg_namespaces.*,
        iceberg_tables.shard_id AS shard_id,
        iceberg_tables.shard_key AS shard_key
      FROM iceberg_namespaces
      JOIN iceberg_tables ON iceberg_namespaces.id = iceberg_tables.namespace_id
    `)

    return result.rows
  }

  private async listDbTablesForBatch(
    namespaceId: string,
    shardKey: string,
    tableNames: string[]
  ): Promise<TableIndex[]> {
    if (tableNames.length === 0) {
      return []
    }

    const result = await multitenantPgExecutor.query<TableIndex>({
      text: `
        SELECT iceberg_tables.name, iceberg_tables.tenant_id
        FROM iceberg_tables
        JOIN iceberg_namespaces ON iceberg_tables.namespace_id = iceberg_namespaces.id
        WHERE iceberg_tables.name = ANY($1::text[])
          AND iceberg_tables.shard_key = $2
          AND iceberg_namespaces.id = $3
      `,
      values: [tableNames, shardKey, namespaceId],
    })

    return result.rows
  }

  private async withTransaction<T>(
    callback: (tnx: ReconcilerTransaction) => Promise<T>
  ): Promise<T> {
    const tnx = await multitenantPgExecutor.beginTransaction()
    try {
      const result = await callback(tnx)
      await tnx.commit()
      return result
    } catch (e) {
      try {
        await tnx.rollback()
      } catch (rollbackError) {
        logSchema.warning(logger, '[IcebergCatalogReconciler] Failed to rollback transaction', {
          type: 'db',
          error: rollbackError,
          metadata: JSON.stringify({ originalError: String(e) }),
        })
      }
      throw e
    }
  }

  private async findCatalogByName(
    tnx: ReconcilerTransaction,
    tenantId: string,
    catalogName: string
  ): Promise<CatalogRow | undefined> {
    const result = await tnx.query<CatalogRow>({
      text: `
        SELECT id, name
        FROM iceberg_catalogs
        WHERE tenant_id = $1
          AND name = $2
          AND deleted_at IS NULL
        LIMIT 1
      `,
      values: [tenantId, catalogName],
    })

    return result.rows[0]
  }

  private async findFirstCatalog(
    tnx: ReconcilerTransaction,
    tenantId: string
  ): Promise<CatalogRow | undefined> {
    const result = await tnx.query<CatalogRow>({
      text: `
        SELECT id, name
        FROM iceberg_catalogs
        WHERE tenant_id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `,
      values: [tenantId],
    })

    return result.rows[0]
  }

  private async clearTenantShardSlots(
    tnx: ReconcilerTransaction,
    shardId: number,
    tenantId: string
  ): Promise<void> {
    const statement = `
      WITH updated_slots AS (
        UPDATE shard_slots
          SET resource_id = null, tenant_id = null
          WHERE shard_id = $1
            AND tenant_id = $2
          RETURNING shard_id, slot_no
      ),
      deleted_reservations AS (
         DELETE FROM shard_reservation
           WHERE shard_id = $1
             AND tenant_id = $2
      )
      SELECT 1;
    `

    await tnx.query({ text: statement, values: [shardId, tenantId] })
  }

  private async insertIcebergTable(
    tnx: ReconcilerTransaction,
    table: {
      name: string
      namespace_id: string
      location: string
      catalog_id: string
      bucket_name: string
      tenant_id: string
      shard_id: number
      shard_key: string
      remote_table_id?: string
    }
  ): Promise<void> {
    const entries = Object.entries(table)
    await tnx.query({
      text: `
        INSERT INTO iceberg_tables (${entries.map(([column]) => column).join(', ')})
        VALUES (${entries.map((_, index) => `$${index + 1}`).join(', ')})
      `,
      values: entries.map(([, value]) => value),
    })
  }

  private async *listNamespaces(shardKey: string) {
    let restToken: string | undefined
    do {
      const resp = await this.restCatalog.listNamespaces({
        warehouse: shardKey,
        pageSize: 1000,
        pageToken: restToken,
      })
      yield resp.namespaces
      restToken = resp['next-page-token']
    } while (restToken)
  }

  private async *listTables(namespaceName: string, shardKey: string) {
    let restToken: string | undefined
    do {
      const resp = await this.restCatalog.listTables({
        warehouse: shardKey,
        namespace: namespaceName,
        pageSize: 1000,
        pageToken: restToken,
      })
      yield resp.identifiers
      restToken = resp['next-page-token']
    } while (restToken)
  }
}
