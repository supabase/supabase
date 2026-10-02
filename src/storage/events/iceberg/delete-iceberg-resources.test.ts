import { vi } from 'vitest'

const {
  MockPgMetastore,
  MockRestCatalogClient,
  MockShardCatalog,
  MockPgShardStoreFactory,
  mockConfig,
  mockCreateStorage,
  mockMultitenantPgExecutor,
} = vi.hoisted(() => ({
  MockPgMetastore: vi.fn(),
  MockRestCatalogClient: vi.fn(),
  MockShardCatalog: vi.fn(),
  MockPgShardStoreFactory: vi.fn(),
  mockConfig: {
    icebergCatalogUrl: 'http://catalog',
    icebergCatalogAuthType: 'none',
    isMultitenant: true,
  },
  mockCreateStorage: vi.fn(),
  mockMultitenantPgExecutor: 'mock-multitenant-executor',
}))

vi.mock('../../../config', () => ({
  getConfig: () => mockConfig,
}))

vi.mock('@internal/database', () => ({
  multitenantPgExecutor: mockMultitenantPgExecutor,
}))

vi.mock('@storage/protocols/iceberg/pg', () => ({
  PgMetastore: MockPgMetastore,
}))

vi.mock('@storage/protocols/iceberg/catalog', () => ({
  RestCatalogClient: MockRestCatalogClient,
  getCatalogAuthStrategy: vi.fn().mockReturnValue('mock-auth'),
}))

vi.mock('@internal/sharding', () => ({
  ShardCatalog: MockShardCatalog,
  PgShardStoreFactory: MockPgShardStoreFactory,
}))

vi.mock('@internal/monitoring', () => ({
  logger: { error: vi.fn() },
}))

vi.mock('../base-event', () => ({
  BaseEvent: class {
    static createStorage = mockCreateStorage
    static getQueueName(this: { queueName: string }) {
      return this.queueName
    }
  },
}))

async function importHandler(isMultitenant: boolean) {
  mockConfig.isMultitenant = isMultitenant
  vi.resetModules()
  return (await import('./delete-iceberg-resources')).DeleteIcebergResources
}

const jobData = {
  catalogId: 'catalog-123',
  tenant: {
    ref: 'tenant-a',
    host: '',
  },
  sbReqId: 'sb-req-123',
}

const metastore = { transaction: vi.fn() }

const store = {
  lockResource: vi.fn(),
  findCatalogById: vi.fn(),
  listNamespaces: vi.fn(),
  listTables: vi.fn(),
  dropTable: vi.fn(),
  dropNamespace: vi.fn(),
  dropCatalog: vi.fn(),
  getTnx: vi.fn(),
}

const restCatalog = {
  dropTable: vi.fn(),
  listTables: vi.fn(),
  dropNamespace: vi.fn(),
}

const shardCatalog = { withTnx: vi.fn() }
const sharder = { freeByResource: vi.fn() }

const db = {
  connection: {
    query: vi.fn(),
  },
  deleteAnalyticsBucket: vi.fn(),
  destroyConnection: vi.fn(),
}

function expectIcebergCleanup({ multitenant }: { multitenant: boolean }) {
  expect(mockCreateStorage).toHaveBeenCalledWith(jobData)
  expect(MockPgMetastore).toHaveBeenCalledWith(
    multitenant ? mockMultitenantPgExecutor : db.connection,
    {
      multiTenant: multitenant,
      schema: multitenant ? 'public' : 'storage',
    }
  )
  expect(metastore.transaction).toHaveBeenCalled()
  expect(store.lockResource).toHaveBeenCalledWith('catalog', 'catalog-123')
  expect(store.findCatalogById).toHaveBeenCalledWith({
    id: 'catalog-123',
    deleted: true,
    tenantId: 'tenant-a',
  })
  expect(store.listNamespaces).toHaveBeenCalledWith({
    catalogId: 'catalog-123',
    tenantId: 'tenant-a',
  })
  expect(store.listTables).toHaveBeenCalledWith({
    namespaceId: 'ns-1',
    pageSize: 1000,
    tenantId: 'tenant-a',
  })
  expect(restCatalog.dropTable).toHaveBeenCalledWith({
    namespace: 'namespace-1',
    table: 'table-1',
    purgeRequested: true,
    warehouse: 'shard-key-1',
  })
  expect(store.dropTable).toHaveBeenCalledWith({
    name: 'table-1',
    namespaceId: 'ns-1',
    catalogId: 'catalog-123',
    tenantId: 'tenant-a',
  })
  expect(restCatalog.listTables).toHaveBeenCalledWith({
    namespace: 'tenant-a_ns_1',
    warehouse: 'shard-key-1',
    pageSize: 1,
  })
  expect(restCatalog.dropNamespace).toHaveBeenCalledWith({
    namespace: 'namespace-1',
    warehouse: 'shard-key-1',
  })
  expect(store.dropNamespace).toHaveBeenCalledWith({
    namespace: 'namespace-1',
    catalogId: 'catalog-123',
    tenantId: 'tenant-a',
  })
  expect(store.dropCatalog).toHaveBeenCalledWith({
    bucketId: 'catalog-123',
    tenantId: 'tenant-a',
    soft: false,
  })

  if (multitenant) {
    expect(MockPgShardStoreFactory).toHaveBeenCalledWith(mockMultitenantPgExecutor)
    expect(MockShardCatalog).toHaveBeenCalled()
    expect(shardCatalog.withTnx).toHaveBeenCalledWith('mock-transaction')
    expect(sharder.freeByResource).toHaveBeenCalledWith('shard-id-1', {
      kind: 'iceberg-table',
      tenantId: 'tenant-a',
      bucketName: 'catalog-123',
      logicalName: 'ns-1/table-1',
    })
  } else {
    expect(MockShardCatalog).not.toHaveBeenCalled()
  }
}

describe('DeleteIcebergResources.handle', () => {
  let DeleteIcebergResources: Awaited<ReturnType<typeof importHandler>>

  const makeJob = () => ({
    id: 'job-1',
    name: DeleteIcebergResources.getQueueName(),
    data: jobData,
  })

  beforeEach(() => {
    vi.clearAllMocks()

    MockPgMetastore.mockImplementation(function () {
      return metastore
    })
    MockRestCatalogClient.mockImplementation(function () {
      return restCatalog
    })
    MockShardCatalog.mockImplementation(function () {
      return shardCatalog
    })

    metastore.transaction.mockImplementation(async (fn) => fn(store))
    store.getTnx.mockReturnValue('mock-transaction')
    shardCatalog.withTnx.mockReturnValue(sharder)
    store.findCatalogById.mockResolvedValue({ id: 'catalog-123', deleted_at: new Date() })
    store.listNamespaces.mockResolvedValue([{ id: 'ns-1', name: 'namespace-1' }])
    store.listTables.mockResolvedValue([
      { name: 'table-1', shard_key: 'shard-key-1', shard_id: 'shard-id-1' },
    ])
    restCatalog.listTables.mockResolvedValue({ identifiers: [] })
    db.deleteAnalyticsBucket.mockResolvedValue(undefined)
    db.destroyConnection.mockReturnValue(undefined)
  })

  describe('multitenant', () => {
    beforeAll(async () => {
      DeleteIcebergResources = await importHandler(true)
    })

    it('should remove all resources and multitenant db rows when createStorage fails', async () => {
      mockCreateStorage.mockRejectedValue(new Error('Tenant not found'))

      await expect(DeleteIcebergResources.handle(makeJob() as never)).resolves.toBeUndefined()

      expectIcebergCleanup({ multitenant: true })
      expect(db.deleteAnalyticsBucket).not.toHaveBeenCalled()
      expect(db.destroyConnection).not.toHaveBeenCalled()
    })

    it('should remove all resources, multitenant db rows, and clean up tenant db when createStorage succeeds', async () => {
      mockCreateStorage.mockResolvedValue({ db })

      await expect(DeleteIcebergResources.handle(makeJob() as never)).resolves.toBeUndefined()

      expectIcebergCleanup({ multitenant: true })
      expect(db.deleteAnalyticsBucket).toHaveBeenCalledWith('catalog-123')
      expect(db.destroyConnection).toHaveBeenCalled()
    })

    it('should still pass when deleteAnalyticsBucket fails with NoSuchBucket', async () => {
      const { ERRORS } = await import('@internal/errors')
      mockCreateStorage.mockResolvedValue({ db })
      db.deleteAnalyticsBucket.mockRejectedValue(ERRORS.NoSuchBucket('catalog-123'))

      await expect(DeleteIcebergResources.handle(makeJob() as never)).resolves.toBeUndefined()

      expectIcebergCleanup({ multitenant: true })
      expect(db.deleteAnalyticsBucket).toHaveBeenCalledWith('catalog-123')
      expect(db.destroyConnection).toHaveBeenCalled()
    })

    it('should fail when deleteAnalyticsBucket fails with any other error', async () => {
      mockCreateStorage.mockResolvedValue({ db })
      db.deleteAnalyticsBucket.mockRejectedValue(new Error('connection reset'))

      await expect(DeleteIcebergResources.handle(makeJob() as never)).rejects.toThrow(
        'connection reset'
      )

      expect(db.deleteAnalyticsBucket).toHaveBeenCalledWith('catalog-123')
      expect(db.destroyConnection).toHaveBeenCalled()
    })
  })

  describe('non-multitenant', () => {
    beforeAll(async () => {
      DeleteIcebergResources = await importHandler(false)
    })

    it('should error when createStorage fails', async () => {
      mockCreateStorage.mockRejectedValue(new Error('Failed to create storage'))

      await expect(DeleteIcebergResources.handle(makeJob() as never)).rejects.toThrow(
        'Failed to create storage'
      )

      expect(mockCreateStorage).toHaveBeenCalledWith(jobData)
      expect(MockPgMetastore).not.toHaveBeenCalled()
      expect(metastore.transaction).not.toHaveBeenCalled()
      expect(store.lockResource).not.toHaveBeenCalled()
      expect(store.dropCatalog).not.toHaveBeenCalled()
      expect(db.connection.query).not.toHaveBeenCalled()
      expect(db.deleteAnalyticsBucket).not.toHaveBeenCalled()
      expect(db.destroyConnection).not.toHaveBeenCalled()
    })

    it('should remove all resources when createStorage succeeds', async () => {
      mockCreateStorage.mockResolvedValue({ db })

      await expect(DeleteIcebergResources.handle(makeJob() as never)).resolves.toBeUndefined()

      expectIcebergCleanup({ multitenant: false })
      expect(db.deleteAnalyticsBucket).not.toHaveBeenCalled()
      expect(db.destroyConnection).toHaveBeenCalled()
    })
  })
})
