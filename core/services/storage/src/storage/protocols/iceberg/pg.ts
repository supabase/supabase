import { randomUUID } from 'node:crypto'
import {
  type DatabaseStatement,
  type DatabaseTransaction,
  type DatabaseTransactionalExecutor,
  isDatabaseTransaction,
  quoteIdentifier,
  type TransactionOptions,
} from '@internal/database'
import { ERRORS, StorageBackendError } from '@internal/errors'
import { hashStringToInt } from '@internal/hashing'
import { logger, logSchema } from '@internal/monitoring'
import { DBError, mapPgTransactionAbortedError } from '@storage/database'
import { IcebergCatalog } from '@storage/schemas'
import { DatabaseError, QueryResult, QueryResultRow } from 'pg'
import {
  Catalog,
  CreateNamespaceParams,
  CreateTableParams,
  DropNamespaceParams,
  ListNamespaceParams,
  Metastore,
  NamespaceIndex,
  TableIndex,
} from './metastore'

export class PgMetastore implements Metastore<DatabaseTransaction> {
  constructor(
    private readonly db: DatabaseTransactionalExecutor | DatabaseTransaction,
    private readonly ops: { schema: string; multiTenant?: boolean }
  ) {}

  async lockResource(resourceType: string, resourceId: string): Promise<void> {
    const lockId = hashStringToInt(`${resourceType}:${resourceId}`)
    await this.query('SELECT pg_advisory_xact_lock($1::bigint)', [String(lockId)])
  }

  getTnx(): DatabaseTransaction {
    if (isDatabaseTransaction(this.db)) {
      return this.db
    }

    throw new Error('Not in a transaction')
  }

  async dropCatalog(params: {
    tenantId?: string
    bucketId: string
    soft?: boolean
  }): Promise<boolean> {
    const values: unknown[] = [params.bucketId]
    const conditions = ['id = $1']
    this.addTenantCondition(conditions, values, params.tenantId)

    const result = params.soft
      ? await this.query(
          `
            UPDATE ${this.catalogTable()}
            SET deleted_at = now()
            WHERE ${conditions.join(' AND ')}
          `,
          values
        )
      : await this.query(
          `
            DELETE FROM ${this.catalogTable()}
            WHERE ${conditions.join(' AND ')}
          `,
          values
        )

    return (result.rowCount ?? 0) > 0
  }

  async listTables(param: {
    tenantId: string
    pageSize: number | undefined
    namespaceId: string
  }): Promise<TableIndex[]> {
    const values: unknown[] = [param.namespaceId]
    const conditions = ['namespace_id = $1']
    this.addTenantCondition(conditions, values, param.tenantId)

    const columns = this.ops.multiTenant
      ? 'id, name, namespace_id, shard_id, shard_key, tenant_id'
      : 'id, name, namespace_id, shard_id, shard_key'
    const limit = param.pageSize ? `LIMIT $${values.push(param.pageSize)}` : ''

    const result = await this.query<TableIndex>(
      `
        SELECT ${columns}
        FROM ${this.table('iceberg_tables')}
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at ASC
        ${limit}
      `,
      values
    )

    return result.rows
  }

  async countResources(params: {
    bucketId?: string
    tenantId?: string
    limit: number
  }): Promise<{ namespaces: number; tables: number }> {
    const namespaceValues: unknown[] = []
    const namespaceConditions: string[] = []
    const tableValues: unknown[] = []
    const tableConditions: string[] = []

    if (params.bucketId) {
      namespaceValues.push(params.bucketId)
      namespaceConditions.push(`bucket_name = $${namespaceValues.length}`)
      tableValues.push(params.bucketId)
      tableConditions.push(`bucket_name = $${tableValues.length}`)
    }

    this.addTenantCondition(namespaceConditions, namespaceValues, params.tenantId)
    this.addTenantCondition(tableConditions, tableValues, params.tenantId)

    const namespaces = await this.countRows(
      'iceberg_namespaces',
      namespaceConditions,
      namespaceValues,
      params.limit
    )
    const tables = await this.countRows(
      'iceberg_tables',
      tableConditions,
      tableValues,
      params.limit
    )

    return { namespaces, tables }
  }

  async findTableByLocation(params: { tenantId?: string; location: string }): Promise<TableIndex> {
    const values: unknown[] = [params.location]
    const conditions = ['location = $1']
    this.addTenantCondition(conditions, values, params.tenantId)

    const columns = this.ops.multiTenant
      ? 'id, name, namespace_id, location, tenant_id'
      : 'id, name, namespace_id, location'
    const result = await this.query<TableIndex>(
      `
        SELECT ${columns}
        FROM ${this.table('iceberg_tables')}
        WHERE ${conditions.join(' AND ')}
        LIMIT 1
      `,
      values
    )

    return result.rows[0] as TableIndex
  }

  async dropTable(params: {
    name: string
    namespaceId: string
    catalogId: string
    tenantId: string
  }): Promise<void> {
    const values: unknown[] = [params.name, params.namespaceId, params.catalogId]
    const conditions = ['name = $1', 'namespace_id = $2', 'catalog_id = $3']
    this.addTenantCondition(conditions, values, params.tenantId)

    await this.query(
      `
        DELETE FROM ${this.table('iceberg_tables')}
        WHERE ${conditions.join(' AND ')}
      `,
      values
    )
  }

  async findCatalogByName(param: {
    tenantId: string
    name: string
    deleted?: boolean
  }): Promise<IcebergCatalog> {
    const values: unknown[] = [param.name]
    const conditions = ['name = $1']

    if (!param.deleted) {
      conditions.push('deleted_at IS NULL')
    }
    this.addTenantCondition(conditions, values, param.tenantId)

    const columns = this.ops.multiTenant ? 'id, name, tenant_id' : 'id, name'
    const result = await this.query<IcebergCatalog>(
      `
        SELECT ${columns}
        FROM ${this.catalogTable()}
        WHERE ${conditions.join(' AND ')}
        LIMIT 1
      `,
      values
    )

    const catalog = result.rows[0]
    if (!catalog) {
      throw ERRORS.NoSuchCatalog(param.name)
    }
    return catalog
  }

  async countCatalogs(params: {
    tenantId: string
    limit: number
    deleted?: boolean
  }): Promise<number> {
    const values: unknown[] = []
    const conditions: string[] = []
    this.addTenantCondition(conditions, values, params.tenantId)

    if (!params.deleted) {
      conditions.push('deleted_at IS NULL')
    }

    return this.countRows('iceberg_catalogs', conditions, values, params.limit)
  }

  async assignCatalog(params: {
    bucketName: string
    bucketId: string
    tenantId: string
  }): Promise<Catalog> {
    const columns = ['id', 'name']
    const values: unknown[] = [params.bucketId, params.bucketName]
    const conflictColumns = ['name']

    if (this.ops.multiTenant) {
      columns.push('tenant_id')
      values.push(params.tenantId)
      conflictColumns.push('tenant_id')
    }

    const result = await this.query<Catalog>(
      `
        INSERT INTO ${this.table('iceberg_catalogs')} (${columns.join(', ')})
        VALUES (${values.map((_, index) => `$${index + 1}`).join(', ')})
        ON CONFLICT (${conflictColumns.join(', ')}) WHERE deleted_at IS NULL
        DO UPDATE SET updated_at = now()
        RETURNING *
      `,
      values
    )

    const catalog = result.rows[0]
    if (!catalog) {
      throw ERRORS.NoSuchKey(params.bucketName)
    }

    return {
      id: catalog.id,
      name: params.bucketName,
      ...(this.ops.multiTenant ? { tenant_id: params.tenantId } : {}),
    }
  }

  async transaction<T>(
    callback: (trx: PgMetastore) => Promise<T>,
    opts?: TransactionOptions
  ): Promise<T> {
    if (isDatabaseTransaction(this.db)) {
      const savepoint = nextSavepointName()
      let savepointEstablished = false

      try {
        await createSavepoint(this.db, savepoint)
        savepointEstablished = true

        const result = await callback(new PgMetastore(this.db, this.ops))
        await this.db.query(`RELEASE SAVEPOINT ${savepoint}`)
        return result
      } catch (e) {
        if (savepointEstablished && !this.db.isCompleted()) {
          try {
            await rollbackSavepoint(this.db, savepoint)
          } catch (rollbackError) {
            logSchema.warning(logger, '[PgMetastore] Failed to rollback savepoint', {
              type: 'db',
              error: rollbackError,
              metadata: JSON.stringify({ originalError: String(e), savepoint }),
            })
          }
        }

        throw this.mapError(e)
      }
    }

    const trx = await this.db.beginTransaction({
      ...opts,
    })
    const storeInTransaction = new PgMetastore(trx, this.ops)

    try {
      const result = await callback(storeInTransaction)
      await trx.commit()
      return result
    } catch (e) {
      try {
        await trx.rollback()
      } catch (rollbackError) {
        logSchema.warning(logger, '[PgMetastore] Failed to rollback transaction', {
          type: 'db',
          error: rollbackError,
          metadata: JSON.stringify({ originalError: String(e) }),
        })
      }
      throw this.mapError(e)
    }
  }

  async findNamespaceByName(params: {
    tenantId: string
    name: string
    catalogId: string
  }): Promise<NamespaceIndex> {
    const values: unknown[] = [params.name, params.catalogId]
    const conditions = ['name = $1', 'catalog_id = $2']
    this.addTenantCondition(conditions, values, params.tenantId)

    const columns = this.ops.multiTenant
      ? 'id, name, bucket_name, metadata, tenant_id'
      : 'id, name, bucket_name, metadata'
    const result = await this.query<NamespaceIndex>(
      `
        SELECT ${columns}
        FROM ${this.table('iceberg_namespaces')}
        WHERE ${conditions.join(' AND ')}
        LIMIT 1
      `,
      values
    )

    const namespace = result.rows[0]
    if (!namespace) {
      throw ERRORS.NoSuchKey(params.name)
    }
    return namespace
  }

  async dropNamespace(params: DropNamespaceParams): Promise<void> {
    const values: unknown[] = [params.namespace, params.catalogId]
    const conditions = ['name = $1', 'catalog_id = $2']
    this.addTenantCondition(conditions, values, params.tenantId)

    try {
      await this.queryRaw({
        text: `
            DELETE FROM ${this.table('iceberg_namespaces')}
            WHERE ${conditions.join(' AND ')}
          `,
        values,
      })
    } catch (error) {
      if (
        error instanceof DatabaseError &&
        (error.code === '23503' ||
          error.message.includes('RESTRICT') ||
          error.message.includes('foreign key constraint'))
      ) {
        throw ERRORS.IcebergResourceNotEmpty('namespace', params.namespace)
      }
      throw this.mapError(error)
    }
  }

  async createNamespace(params: CreateNamespaceParams): Promise<NamespaceIndex> {
    const columns = ['name', 'catalog_id', 'bucket_name', 'metadata']
    const values: unknown[] = [params.name, params.bucketId, params.bucketName, params.metadata]
    const conflictColumns = ['catalog_id', 'name']

    if (this.ops.multiTenant) {
      columns.push('tenant_id')
      values.push(params.tenantId)
      conflictColumns.unshift('tenant_id')
    }

    const result = await this.query<NamespaceIndex>(
      `
        INSERT INTO ${this.table('iceberg_namespaces')} (${columns.join(', ')})
        VALUES (${values.map((_, index) => `$${index + 1}`).join(', ')})
        ON CONFLICT (${conflictColumns.join(', ')})
        DO UPDATE SET
          updated_at = now(),
          metadata = ${this.table('iceberg_namespaces')}.metadata || EXCLUDED.metadata
        RETURNING *
      `,
      values
    )

    const namespace = result.rows[0]
    if (!namespace) {
      throw ERRORS.NoSuchKey(params.name)
    }

    return namespace
  }

  async listNamespaces(params: ListNamespaceParams): Promise<NamespaceIndex[]> {
    const values: unknown[] = [params.catalogId]
    const conditions = ['catalog_id = $1']
    this.addTenantCondition(conditions, values, params.tenantId)

    const columns = this.ops.multiTenant
      ? 'id, name, bucket_name, tenant_id'
      : 'id, name, bucket_name'
    const result = await this.query<NamespaceIndex>(
      `
        SELECT ${columns}
        FROM ${this.table('iceberg_namespaces')}
        WHERE ${conditions.join(' AND ')}
      `,
      values
    )

    return result.rows
  }

  async createTable(params: CreateTableParams): Promise<TableIndex> {
    const columns = [
      'name',
      'catalog_id',
      'bucket_name',
      'namespace_id',
      'location',
      'shard_key',
      'shard_id',
      'remote_table_id',
    ]
    const values: unknown[] = [
      params.name,
      params.bucketId,
      params.bucketName,
      params.namespaceId,
      params.location,
      params.shardKey,
      params.shardId,
      params.remoteTableId,
    ]
    const conflictColumns = ['catalog_id', 'name', 'namespace_id']

    if (this.ops.multiTenant) {
      columns.push('tenant_id')
      values.push(params.tenantId)
      conflictColumns.unshift('tenant_id')
    }

    const result = await this.query<TableIndex>(
      `
        INSERT INTO ${this.table('iceberg_tables')} (${columns.join(', ')})
        VALUES (${values.map((_, index) => `$${index + 1}`).join(', ')})
        ON CONFLICT (${conflictColumns.join(', ')})
        DO UPDATE SET updated_at = now(), location = $5
        RETURNING *
      `,
      values
    )

    const table = result.rows[0]
    if (!table) {
      throw ERRORS.NoSuchKey(params.name)
    }

    return table
  }

  async findTableById(params: {
    tenantId: string
    id: string
    namespaceId: string
  }): Promise<TableIndex> {
    const values: unknown[] = [params.namespaceId, params.id]
    const conditions = ['namespace_id = $1', 'id = $2']
    this.addTenantCondition(conditions, values, params.tenantId)

    return this.findSingleTable(conditions, values, params.id)
  }

  async findTableByName(params: {
    tenantId: string
    name: string
    namespaceId: string
  }): Promise<TableIndex> {
    const values: unknown[] = [params.name, params.namespaceId]
    const conditions = ['name = $1', 'namespace_id = $2']
    this.addTenantCondition(conditions, values, params.tenantId)

    return this.findSingleTable(conditions, values, params.name)
  }

  async countTables(params: {
    namespaceId: string
    tenantId?: string
    limit: number
  }): Promise<number> {
    const values: unknown[] = [params.namespaceId]
    const conditions = ['namespace_id = $1']
    this.addTenantCondition(conditions, values, params.tenantId)

    return this.countRows('iceberg_tables', conditions, values, params.limit)
  }

  async countNamespaces(param: { tenantId: string; limit: number }): Promise<number> {
    const values: unknown[] = []
    const conditions: string[] = []
    this.addTenantCondition(conditions, values, param.tenantId)

    return this.countRows('iceberg_namespaces', conditions, values, param.limit)
  }

  async findCatalogById(param: {
    id: string
    tenantId: string
    deleted?: boolean
  }): Promise<IcebergCatalog> {
    const values: unknown[] = [param.id]
    const conditions = ['id = $1']

    if (!param.deleted) {
      conditions.push('deleted_at IS NULL')
    }
    this.addTenantCondition(conditions, values, param.tenantId)

    const columns = this.ops.multiTenant
      ? 'id, name, tenant_id, deleted_at'
      : 'id, name, deleted_at'
    const result = await this.query<IcebergCatalog>(
      `
        SELECT ${columns}
        FROM ${this.catalogTable()}
        WHERE ${conditions.join(' AND ')}
        LIMIT 1
      `,
      values
    )

    const catalog = result.rows[0]
    if (!catalog) {
      throw ERRORS.NoSuchCatalog(param.id)
    }
    return catalog
  }

  private async findSingleTable(
    conditions: string[],
    values: unknown[],
    key: string
  ): Promise<TableIndex> {
    const columns = this.ops.multiTenant
      ? 'id, name, namespace_id, location, shard_key, shard_id, tenant_id'
      : 'id, name, namespace_id, location, shard_key, shard_id'
    const result = await this.query<TableIndex>(
      `
        SELECT ${columns}
        FROM ${this.table('iceberg_tables')}
        WHERE ${conditions.join(' AND ')}
        LIMIT 1
      `,
      values
    )

    const table = result.rows[0]
    if (!table) {
      throw ERRORS.NoSuchKey(key)
    }
    return table
  }

  private async countRows(
    tableName: string,
    conditions: string[],
    values: unknown[],
    limit: number
  ): Promise<number> {
    values.push(limit)
    try {
      const result = await this.query<{ count: string | number }>(
        `
          SELECT count(*) AS count
          FROM (
            SELECT 1
            FROM ${this.table(tableName)}
            ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
            LIMIT $${values.length}
          ) limited_rows
        `,
        values
      )

      return Number(result.rows[0]?.count ?? 0)
    } finally {
      values.pop()
    }
  }

  private addTenantCondition(
    conditions: string[],
    values: unknown[],
    tenantId: string | undefined
  ) {
    if (!this.ops.multiTenant) {
      return
    }

    values.push(tenantId)
    conditions.push(`tenant_id = $${values.length}`)
  }

  private catalogTable() {
    return this.ops.multiTenant ? this.table('iceberg_catalogs') : this.table('buckets_analytics')
  }

  private table(tableName: string) {
    return `${quoteIdentifier(this.ops.schema)}.${quoteIdentifier(tableName)}`
  }

  private async query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values?: unknown[]
  ): Promise<QueryResult<T>> {
    try {
      return await this.db.query<T>({ text, values })
    } catch (e) {
      throw this.mapError(e, text)
    }
  }

  private queryRaw<T extends QueryResultRow = QueryResultRow>(
    statement: DatabaseStatement
  ): Promise<QueryResult<T>> {
    return this.db.query<T>(statement)
  }

  private mapError(error: unknown, query?: string) {
    if (error instanceof StorageBackendError) {
      return error
    }

    if (error instanceof DatabaseError) {
      return DBError.fromDBError(error, query)
    }

    return error
  }
}

function nextSavepointName(): string {
  return quoteIdentifier(`iceberg_pg_transaction_${randomUUID().replace(/-/g, '_')}`)
}

async function createSavepoint(tnx: DatabaseTransaction, savepoint: string): Promise<void> {
  const query = `SAVEPOINT ${savepoint}`

  try {
    await tnx.query(query)
  } catch (error) {
    throw mapPgTransactionAbortedError(error, query)
  }
}

async function rollbackSavepoint(tnx: DatabaseTransaction, savepoint: string): Promise<void> {
  await tnx.query(`ROLLBACK TO SAVEPOINT ${savepoint}`)
  await tnx.query(`RELEASE SAVEPOINT ${savepoint}`)
}
