import { ERRORS, ErrorCode, StorageBackendError } from '@internal/errors'
import { Sharder } from '@internal/sharding'
import { ICEBERG_BUCKET_RESERVED_SUFFIX } from '@storage/limits'
import {
  createAlreadyExistsError,
  createNoSuchNamespaceError,
  createNoSuchTableError,
  IcebergError,
  IcebergHttpStatusCode,
} from '@storage/protocols/iceberg/catalog/errors'
import { Metastore } from '../metastore'
import {
  CatalogAuthType,
  CommitTableRequest,
  CreateNamespaceRequest,
  CreateTableRequest,
  DeleteNamespaceRequest,
  DropTableRequest,
  GetConfigRequest,
  ListNamespacesRequest,
  ListTableRequest,
  LoadNamespaceMetadataRequest,
  LoadTableRequest,
  NamespaceExistsRequest,
  RestCatalogClient,
  TableExistsRequest,
} from './rest-catalog-client'

/**
 * Configuration options for the tenant-aware REST catalog client
 */
export interface RestCatalogTenantOptions {
  accessKeyId?: string
  secretAccessKey?: string
  tenantId: string
  restCatalogUrl: string
  metastore: Metastore
  auth: CatalogAuthType
  sharding: Sharder
  limits: {
    maxCatalogsCount: number
    maxNamespaceCount: number
    maxTableCount: number
  }
}
/**
 * Parameters for finding a table by its ID
 */
interface FindTableByIdParams {
  id: string
  tenantId: string
  namespaceId: string
}

function isMetastoreNoSuchKeyError(error: unknown) {
  return error instanceof StorageBackendError && error.code === ErrorCode.NoSuchKey
}

async function findNamespaceByNameOrThrow(
  metastore: Pick<Metastore, 'findNamespaceByName'>,
  params: Parameters<Metastore['findNamespaceByName']>[0]
) {
  try {
    return await metastore.findNamespaceByName(params)
  } catch (error) {
    if (isMetastoreNoSuchKeyError(error)) {
      throw createNoSuchNamespaceError('Namespace not found')
    }

    throw error
  }
}

async function findTableByNameOrThrow(
  metastore: Pick<Metastore, 'findTableByName'>,
  params: Parameters<Metastore['findTableByName']>[0]
) {
  try {
    return await metastore.findTableByName(params)
  } catch (error) {
    if (isMetastoreNoSuchKeyError(error)) {
      throw createNoSuchTableError('Table not found')
    }

    throw error
  }
}

/**
 * A tenant-aware REST catalog implementation for Iceberg tables
 *
 * This class extends the base REST catalog proxy and adds tenant isolation features,
 * mapping tenant-specific names to internal representations and managing permissions.
 */

export class TenantAwareRestCatalog extends RestCatalogClient {
  tenantId: string

  /**
   * Creates a new tenant-aware REST catalog client
   * @param options Configuration options for the catalog
   */
  constructor(private readonly options: RestCatalogTenantOptions) {
    super({
      catalogUrl: options.restCatalogUrl,
      auth: options.auth,
    })

    this.tenantId = options.tenantId
  }

  async getConfig(params: GetConfigRequest) {
    const catalog = await this.findCatalogByName({
      tenantId: this.tenantId,
      name: params.warehouse,
    })

    return {
      defaults: {
        'write.object-storage.partitioned-paths': 'false',
        's3.delete-enabled': 'false',
        'io-impl': 'org.apache.iceberg.aws.s3.S3FileIO',
        'write.object-storage.enabled': 'true',
        prefix: catalog.name,
        'rest-metrics-reporting-enabled': 'false',
      },
      overrides: {
        prefix: catalog.name,
      },
    }
  }

  findCatalogByName(params: { tenantId: string; name: string }) {
    // Find the catalog by bucket ID and tenant ID in the metastore
    return this.options.metastore.findCatalogByName({
      name: params.name,
      tenantId: params.tenantId,
    })
  }

  findTableByLocation(params: { location: string; tenantId: string }) {
    // Find the table by its location in the metastore
    return this.options.metastore.findTableByLocation({
      location: params.location,
      tenantId: params.tenantId,
    })
  }

  async registerCatalog(params: { bucketName: string; bucketId: string; tenantId: string }) {
    // Register the catalog with the Iceberg REST API
    return this.options.metastore.transaction(async (store) => {
      const catalogCount = await store.countCatalogs({
        tenantId: params.tenantId,
        limit: this.options.limits.maxCatalogsCount + 1,
      })

      if (catalogCount >= this.options.limits.maxCatalogsCount) {
        throw ERRORS.IcebergMaximumResourceLimit('catalog', this.options.limits.maxCatalogsCount)
      }

      return store.assignCatalog({
        bucketId: params.bucketId,
        bucketName: params.bucketName,
        tenantId: params.tenantId,
      })
    })
  }

  /**
   * Creates a new Iceberg table for the current tenant
   *
   * Maps the tenant's namespace to an internal representation and registers
   * the table in both the Iceberg catalog and the local metastore.
   *
   * @param param0 Table creation parameters
   * @returns The created table with modified location paths
   */
  async createTable({ namespace, ...table }: CreateTableRequest) {
    this.validateResourceName(table.name)

    return this.options.metastore.transaction(async (store) => {
      const catalog = await store.findCatalogByName({
        tenantId: this.tenantId,
        name: table.warehouse,
      })

      const dbNamespace = await findNamespaceByNameOrThrow(store, {
        name: namespace,
        tenantId: this.tenantId,
        catalogId: catalog.id,
      })

      try {
        await store.findTableByName({
          name: table.name,
          namespaceId: dbNamespace.id,
          tenantId: this.tenantId,
        })

        throw createAlreadyExistsError('Table already exists')
      } catch (e) {
        if (!(e instanceof StorageBackendError && e.code === ErrorCode.NoSuchKey)) {
          throw e
        }
      }

      await store.lockResource('namespace', `${this.tenantId}:${dbNamespace.id}`)

      const sharder = this.options.sharding.withTnx(store.getTnx())

      const tableCount = await store.countTables({
        tenantId: this.tenantId,
        limit: this.options.limits.maxTableCount,
        namespaceId: dbNamespace.id,
      })

      if (tableCount >= this.options.limits.maxTableCount) {
        throw ERRORS.IcebergMaximumResourceLimit('table', this.options.limits.maxTableCount)
      }

      const namespaceName = this.getTenantNamespaceName(dbNamespace.id)

      const { shardId, reservationId, shardKey } = await sharder.reserve({
        tenantId: this.tenantId,
        kind: 'iceberg-table',
        logicalName: `${dbNamespace.id}/${table.name}`,
        bucketName: catalog.id,
      })

      try {
        await super.createNamespace({
          namespace: [namespaceName],
          warehouse: shardKey,
          // Note: Underline catalog doesn't support this
          // properties: {
          //   ...(dbNamespace.metadata ? dbNamespace.metadata : {}),
          //   'bucket-name': catalog.name,
          //   'tenant-id': this.tenantId,
          // },
        })
      } catch (e) {
        if (e instanceof IcebergError && e.code === IcebergHttpStatusCode.Conflict) {
          // Namespace already exists, ignore
        } else {
          throw e
        }
      }

      const icebergTable = await super.createTable({
        ...table,
        warehouse: shardKey,
        namespace: namespaceName,
      })

      await store.createTable({
        name: table.name,
        bucketId: catalog.id,
        bucketName: catalog.name,
        namespaceId: dbNamespace.id,
        tenantId: this.options.tenantId,
        location: icebergTable['metadata'].location as string,
        shardKey,
        shardId,
        remoteTableId: icebergTable['metadata']['table-uuid'],
      })

      await sharder.confirm(reservationId, {
        logicalName: `${dbNamespace.id}/${table.name}`,
        tenantId: this.tenantId,
        kind: 'iceberg-table',
        bucketName: catalog.id,
      })

      return icebergTable
    })
  }

  /**
   * Lists tables in the specified namespace for the current tenant
   *
   * Maps the tenant's namespace to an internal representation and returns
   * the tables with tenant-friendly identifiers.
   *
   * @param params List tables request parameters
   * @returns List of table identifiers in the namespace
   */
  async listTables(params: ListTableRequest) {
    const catalog = await this.findCatalogByName({
      tenantId: this.tenantId,
      name: params.warehouse,
    })

    const dbNamespace = await findNamespaceByNameOrThrow(this.options.metastore, {
      name: params.namespace,
      tenantId: this.tenantId,
      catalogId: catalog.id,
    })

    const tables = await this.options.metastore.listTables({
      tenantId: this.tenantId,
      pageSize: params.pageSize,
      namespaceId: dbNamespace.id,
    })

    const identifiers = tables.map((table) => {
      const namespace = params.namespace
      return {
        name: table.name,
        namespace: [namespace],
      }
    })

    return {
      identifiers,
    }
  }

  /**
   * Loads a table by name from the specified namespace for the current tenant
   *
   * Maps the tenant's namespace to an internal representation and returns
   * the table with tenant-friendly paths.
   *
   * @param params Load table request parameters
   * @returns The loaded table with modified location paths
   */
  async loadTable(params: LoadTableRequest) {
    const catalog = await this.findCatalogByName({
      tenantId: this.tenantId,
      name: params.warehouse,
    })

    const namespace = await findNamespaceByNameOrThrow(this.options.metastore, {
      tenantId: this.tenantId,
      name: params.namespace,
      catalogId: catalog.id,
    })

    const dbTable = await findTableByNameOrThrow(this.options.metastore, {
      tenantId: this.tenantId,
      name: params.table,
      namespaceId: namespace.id,
    })

    const namespaceName = this.getTenantNamespaceName(namespace.id)

    if (!dbTable.shard_key) {
      throw ERRORS.ShardNotFound(`Table shard key not found for table ${params.table}`)
    }

    return super.loadTable({
      ...params,
      warehouse: dbTable.shard_key,
      namespace: namespaceName,
      snapshots: 'all',
    })
  }

  /**
   * Updates an existing Iceberg table for the current tenant
   *
   * Maps the tenant's namespace to an internal representation and updates
   * the table in the Iceberg catalog.
   *
   * @param params Update table request parameters
   * @returns The updated table with modified location paths
   */
  async updateTable(params: CommitTableRequest) {
    return this.options.metastore.transaction(async (store) => {
      const catalog = await store.findCatalogByName({
        tenantId: this.tenantId,
        name: params.warehouse,
      })

      const namespace = await findNamespaceByNameOrThrow(store, {
        tenantId: this.tenantId,
        name: params.namespace,
        catalogId: catalog.id,
      })

      const dbTable = await findTableByNameOrThrow(store, {
        tenantId: this.tenantId,
        name: params.table,
        namespaceId: namespace.id,
      })

      if (!dbTable.shard_key) {
        throw ERRORS.ShardNotFound(`Table shard key not found for table ${params.table}`)
      }

      const namespaceName = this.getTenantNamespaceName(namespace.id)

      return await super.updateTable({
        ...params,
        warehouse: dbTable.shard_key,
        namespace: namespaceName,
      })
    })
  }

  /**
   * Asserts that a table exists in the specified namespace for the current tenant
   *
   * Maps the tenant's namespace to an internal representation before checking.
   *
   * @param params Table exists request parameters
   * @returns Resolves with no body when the table exists
   * @throws NoSuchTableException when the table is missing
   */
  async tableExists(params: TableExistsRequest): Promise<void> {
    const catalog = await this.findCatalogByName({
      tenantId: this.tenantId,
      name: params.warehouse,
    })

    const namespace = await findNamespaceByNameOrThrow(this.options.metastore, {
      tenantId: this.tenantId,
      name: params.namespace,
      catalogId: catalog.id,
    })

    const dbTable = await findTableByNameOrThrow(this.options.metastore, {
      tenantId: this.tenantId,
      name: params.table,
      namespaceId: namespace.id,
    })

    if (!dbTable.shard_key) {
      throw ERRORS.ShardNotFound(`Table shard key not found for table ${params.table}`)
    }

    const namespaceName = this.getTenantNamespaceName(namespace.id)

    return super.tableExists({
      ...params,
      warehouse: dbTable.shard_key,
      namespace: namespaceName,
    })
  }

  /**
   * Asserts that a namespace exists for the current tenant
   *
   * Maps the tenant's namespace to an internal representation before checking.
   *
   * @param params Namespace exists request parameters
   * @returns Resolves with no body when the namespace exists
   * @throws NoSuchNamespaceException when the namespace is missing
   */
  async namespaceExists(params: NamespaceExistsRequest): Promise<void> {
    const catalog = await this.findCatalogByName({
      tenantId: this.tenantId,
      name: params.warehouse,
    })

    await findNamespaceByNameOrThrow(this.options.metastore, {
      tenantId: this.tenantId,
      name: params.namespace,
      catalogId: catalog.id,
    })
  }

  /**
   * Creates a new namespace for the current tenant
   *
   * Assigns a unique internal ID for the namespace and creates both
   * a metastore entry and the physical namespace in the catalog.
   *
   * @param params Create namespace request parameters
   * @returns The created namespace identifier
   */
  async createNamespace(params: CreateNamespaceRequest) {
    this.validateResourceName(params.namespace[0])

    return await this.options.metastore.transaction(async (store) => {
      await store.lockResource('namespace', `${this.tenantId}:creation`)

      const namespaceCount = await store.countNamespaces({
        tenantId: this.tenantId,
        limit: this.options.limits.maxNamespaceCount + 1,
      })

      if (namespaceCount >= this.options.limits.maxNamespaceCount) {
        throw ERRORS.IcebergMaximumResourceLimit('namespace', this.options.limits.maxNamespaceCount)
      }

      const catalog = await store.findCatalogByName({
        tenantId: this.tenantId,
        name: params.warehouse,
      })

      const namespace = await store.createNamespace({
        name: params.namespace[0],
        bucketId: catalog.id,
        bucketName: catalog.name,
        metadata: params.properties || {},
        tenantId: this.options.tenantId,
      })

      return { namespace: [namespace.name], properties: namespace.metadata || {} }
    })
  }

  /**
   * Loads metadata for a namespace for the current tenant
   *
   * Maps the tenant's namespace to an internal representation before loading.
   *
   * @param params Load namespace metadata request parameters
   * @returns The namespace metadata
   */
  async loadNamespaceMetadata(params: LoadNamespaceMetadataRequest) {
    const catalog = await this.findCatalogByName({
      tenantId: this.tenantId,
      name: params.warehouse,
    })

    const namespace = await findNamespaceByNameOrThrow(this.options.metastore, {
      name: params.namespace,
      tenantId: this.tenantId,
      catalogId: catalog.id,
    })

    return {
      namespace: [namespace.name],
      properties: namespace.metadata || {},
    }
  }

  /**
   * Lists all namespaces for the current tenant
   *
   * @param params List namespaces request parameters
   * @returns List of namespace identifiers
   */
  async listNamespaces(params: ListNamespacesRequest) {
    const catalog = await this.findCatalogByName({
      tenantId: this.tenantId,
      name: params.warehouse,
    })

    const namespaces = await this.options.metastore.listNamespaces({
      catalogId: catalog.id,
      tenantId: this.tenantId,
    })

    return { namespaces: namespaces.map((n) => [n.name]) }
  }

  async dropTable(params: DropTableRequest) {
    const catalog = await this.findCatalogByName({
      tenantId: this.tenantId,
      name: params.warehouse,
    })

    const namespace = await findNamespaceByNameOrThrow(this.options.metastore, {
      tenantId: this.tenantId,
      name: params.namespace,
      catalogId: catalog.id,
    })

    const dbTable = await findTableByNameOrThrow(this.options.metastore, {
      tenantId: this.tenantId,
      name: params.table,
      namespaceId: namespace.id,
    })

    if (!dbTable.shard_key || !dbTable.shard_id) {
      throw ERRORS.ShardNotFound(`Table shard key not found for table ${params.table}`)
    }

    const namespaceName = this.getTenantNamespaceName(namespace.id)

    return this.options.metastore.transaction(async (store) => {
      await store.lockResource('namespace', `${this.tenantId}:${namespace.id}`)

      const sharder = this.options.sharding.withTnx(store.getTnx())

      await store.dropTable({
        name: params.table,
        namespaceId: namespace.id,
        tenantId: this.tenantId,
        catalogId: catalog.id,
      })

      await sharder.freeByResource(dbTable.shard_id!, {
        logicalName: `${namespace.id}/${params.table}`,
        tenantId: this.tenantId,
        kind: 'iceberg-table',
        bucketName: params.warehouse,
      })

      // Catalog call to drop the table
      await super.dropTable({
        ...params,
        warehouse: dbTable.shard_key!,
        purgeRequested: params.purgeRequested,
        namespace: namespaceName,
      })

      const tableCount = await super.listTables({
        warehouse: dbTable.shard_key!,
        namespace: namespaceName,
        pageSize: 1,
      })

      // If no more tables exist in the namespace, delete the upstream namespace from the shard
      if (tableCount.identifiers.length === 0) {
        await super.dropNamespace({
          namespace: namespaceName,
          warehouse: dbTable.shard_key!,
        })
      }
    })
  }

  /**
   * Deletes a namespace for the current tenant
   *
   * Maps the tenant's namespace to an internal representation before deleting.
   *
   * @param params Delete namespace request parameters
   */
  async dropNamespace(params: DeleteNamespaceRequest) {
    const catalog = await this.findCatalogByName({
      tenantId: this.tenantId,
      name: params.warehouse,
    })

    const namespace = await findNamespaceByNameOrThrow(this.options.metastore, {
      name: params.namespace,
      tenantId: this.tenantId,
      catalogId: catalog.id,
    })

    return this.options.metastore.transaction(async (store) => {
      await store.lockResource('namespace', `${this.tenantId}:${namespace.id}`)

      const tableCount = await store.countTables({
        tenantId: this.tenantId,
        namespaceId: namespace.id,
        limit: 1,
      })

      if (tableCount > 0) {
        throw ERRORS.IcebergResourceNotEmpty('namespace', params.namespace)
      }

      await store.dropNamespace({
        namespace: namespace.name,
        catalogId: catalog.id,
        tenantId: this.tenantId,
      })
    })
  }

  /**
   * Finds a table by its ID for a specific tenant
   *
   * @param params Find table parameters including tenant ID and table ID
   * @returns The table metadata
   */
  async findTableById(params: FindTableByIdParams) {
    return this.options.metastore.findTableById(params)
  }

  /**
   * Finds a namespace by name for a specific tenant
   *
   * @param params Find namespace parameters including tenant ID and namespace name
   * @returns The namespace metadata
   */
  findNamespaceByName(params: { name: string; catalogId: string; tenantId: string }) {
    return this.options.metastore.findNamespaceByName(params)
  }

  /**
   * Converts a namespace to a tenant-specific format
   * @param namespace
   * @protected
   */
  protected getTenantNamespaceName(namespace: string) {
    // Convert the namespace to the tenant-specific format
    return `${this.tenantId}_${namespace.replaceAll('-', '_')}`
  }

  private validateResourceName(namespace: string) {
    if (!namespace || namespace.length < 1 || namespace.length > 255) {
      throw ERRORS.InvalidParameter('namespace', {
        message: 'Resource name must be between 1 and 255 characters long',
      })
    }

    if (!/^[a-z0-9][a-z0-9_]*[a-z0-9]$|^[a-z0-9]$/.test(namespace)) {
      throw ERRORS.InvalidParameter('namespace', {
        message:
          'Resource name must contain only lowercase letters, numbers, and underscores, and must begin and end with a letter or number',
      })
    }

    if (namespace.includes('-') || namespace.includes('.')) {
      throw ERRORS.InvalidParameter('namespace', {
        message: 'Resource name must not contain hyphens (-) or periods (.)',
      })
    }

    if (namespace.startsWith('aws')) {
      throw ERRORS.InvalidParameter('namespace', {
        message: 'Resource name must not start with the reserved prefix "aws"',
      })
    }

    if (namespace.endsWith('--iceberg')) {
      throw ERRORS.InvalidParameter('namespace', {
        message: 'Resource name must not end with the reserved suffix "--iceberg"',
      })
    }

    if (namespace.endsWith('--s3-table')) {
      throw ERRORS.InvalidParameter('namespace', {
        message: 'Resource name must not end with the reserved suffix "--s3-table"',
      })
    }

    if (namespace.endsWith(ICEBERG_BUCKET_RESERVED_SUFFIX)) {
      throw ERRORS.InvalidParameter('namespace', {
        message: `Resource name must not end with the reserved suffix "${ICEBERG_BUCKET_RESERVED_SUFFIX}"`,
      })
    }
  }
}
