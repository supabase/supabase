import type { TransactionOptions } from '@internal/database'
import { IcebergCatalog } from '@storage/schemas'

export interface CreateNamespaceParams {
  name: string
  bucketName: string
  bucketId: string
  tenantId?: string
  metadata: Record<string, string | number>
}

export interface ListNamespaceParams {
  tenantId?: string
  catalogId: string
}

export interface NamespaceIndex {
  id: string
  name: string
  catalog_id: string
  bucket_name: string
  tenant_id?: string
  metadata?: Record<string, string | number>
}

export interface Catalog {
  id: string
  name: string
  tenant_id?: string
}

export interface TableIndex {
  id: string
  name: string
  catalog_id: string
  bucket_name: string
  namespace_id: string
  location: string
  tenant_id?: string
  shard_key?: string
  shard_id?: string
  remote_table_id?: string
}

export interface DropNamespaceParams {
  namespace: string
  catalogId: string
  tenantId?: string
}

export interface CreateTableParams {
  name: string
  bucketId: string
  bucketName: string
  namespaceId: string
  tenantId?: string
  shardKey?: string
  shardId?: string
  location: string
  remoteTableId?: string
}

export interface Metastore<Tnx = unknown> {
  createNamespace(params: CreateNamespaceParams): Promise<NamespaceIndex>
  listNamespaces(params: ListNamespaceParams): Promise<NamespaceIndex[]>
  dropNamespace(params: DropNamespaceParams): Promise<void>
  dropCatalog(params: { tenantId?: string; bucketId: string; soft?: boolean }): Promise<boolean>

  createTable(params: CreateTableParams): Promise<TableIndex>
  dropTable(params: {
    name: string
    namespaceId: string
    catalogId: string
    tenantId: string
  }): Promise<void>
  findTableByLocation(params: { tenantId?: string; location: string }): Promise<TableIndex>
  findTableById(params: { tenantId?: string; namespaceId: string; id: string }): Promise<TableIndex>
  findTableByName(params: {
    tenantId?: string
    name: string
    namespaceId: string
  }): Promise<TableIndex>
  findNamespaceByName(params: {
    tenantId: string
    catalogId: string
    name: string
  }): Promise<NamespaceIndex>
  transaction<T>(
    callback: (trx: Metastore<Tnx>) => Promise<T>,
    opts?: TransactionOptions
  ): Promise<T>

  assignCatalog(param: { bucketName: string; bucketId: string; tenantId: string }): Promise<Catalog>
  countCatalogs(params: { tenantId: string; limit: number; deleted?: boolean }): Promise<number>
  countNamespaces(param: { tenantId: string; limit: number }): Promise<number>
  countTables(params: { namespaceId: string; tenantId?: string; limit: number }): Promise<number>
  countResources(params: {
    bucketId?: string
    tenantId?: string
    limit: number
  }): Promise<{ namespaces: number; tables: number }>
  findCatalogByName(param: {
    tenantId: string
    name: string
    deleted?: boolean
  }): Promise<IcebergCatalog>

  findCatalogById(param: {
    tenantId: string
    id: string
    deleted?: boolean
  }): Promise<IcebergCatalog>

  listTables(param: {
    tenantId: string
    pageSize: number | undefined
    namespaceId: string
  }): Promise<TableIndex[]>

  lockResource(resourceType: string, resourceId: string): Promise<void>

  getTnx(): Tnx
}
