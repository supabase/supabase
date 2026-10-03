import { ERRORS, ErrorCode } from '@internal/errors'
import type { Sharder } from '@internal/sharding'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Metastore } from '../metastore'
import { IcebergErrorType } from './errors'
import type { CatalogAuthType } from './rest-catalog-client'
import { TenantAwareRestCatalog } from './tenant-catalog'

function createCatalog(metastore: Partial<Metastore>) {
  const auth: CatalogAuthType = {
    authorize: (req) => req,
  }

  return new TenantAwareRestCatalog({
    tenantId: 'tenant-id',
    restCatalogUrl: 'https://catalog.example.com/v1',
    metastore: metastore as unknown as Metastore,
    auth,
    sharding: {} as Sharder,
    limits: {
      maxCatalogsCount: 10,
      maxNamespaceCount: 10,
      maxTableCount: 10,
    },
  })
}

function expectNoSuchCatalog(error: Promise<unknown>) {
  return expect(error).rejects.toMatchObject({
    code: ErrorCode.NoSuchCatalog,
    message: 'Catalog name "warehouse" not found',
  })
}

describe('TenantAwareRestCatalog exists checks', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps a local missing table row to NoSuchTableException', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName: vi.fn().mockResolvedValue({ id: 'namespace-id', name: 'namespace' }),
      findTableByName: vi.fn().mockRejectedValue(ERRORS.NoSuchKey('table')),
    })

    await expect(
      catalog.tableExists({ warehouse: 'warehouse', namespace: 'namespace', table: 'table' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'Table not found',
      type: IcebergErrorType.NoSuchTableException,
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps a missing warehouse distinct for tableExists', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockRejectedValue(ERRORS.NoSuchCatalog('warehouse')),
    })

    await expectNoSuchCatalog(
      catalog.tableExists({ warehouse: 'warehouse', namespace: 'namespace', table: 'table' })
    )

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a local missing namespace row to NoSuchNamespaceException for tableExists', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName: vi.fn().mockRejectedValue(ERRORS.NoSuchKey('namespace')),
    })

    await expect(
      catalog.tableExists({ warehouse: 'warehouse', namespace: 'namespace', table: 'table' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'Namespace not found',
      type: IcebergErrorType.NoSuchNamespaceException,
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps a missing warehouse distinct for namespaceExists', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockRejectedValue(ERRORS.NoSuchCatalog('warehouse')),
    })

    await expectNoSuchCatalog(
      catalog.namespaceExists({ warehouse: 'warehouse', namespace: 'namespace' })
    )

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('forwards tableExists to the upstream catalog with shard_key as warehouse and tenant-prefixed namespace', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName: vi.fn().mockResolvedValue({ id: 'abc-def-ghi', name: 'namespace' }),
      findTableByName: vi
        .fn()
        .mockResolvedValue({ id: 'table-id', name: 'table', shard_key: 'shard-1' }),
    })

    await expect(
      catalog.tableExists({ warehouse: 'warehouse', namespace: 'namespace', table: 'table' })
    ).resolves.toBeUndefined()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [fetchedInput, init] = fetchMock.mock.calls[0]
    const url = new URL(String(fetchedInput))
    expect(init?.method).toBe('HEAD')
    expect(url.pathname).toBe('/v1/shard-1/namespaces/tenant-id_abc_def_ghi/tables/table')
  })

  it('throws ShardNotFound when the local table row has no shard_key', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName: vi.fn().mockResolvedValue({ id: 'namespace-id', name: 'namespace' }),
      findTableByName: vi.fn().mockResolvedValue({ id: 'table-id', name: 'table' }),
    })

    await expect(
      catalog.tableExists({ warehouse: 'warehouse', namespace: 'namespace', table: 'table' })
    ).rejects.toMatchObject({
      code: ErrorCode.ShardNotFound,
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('resolves namespaceExists from the local metastore without an HTTP call', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const findNamespaceByName = vi.fn().mockResolvedValue({ id: 'namespace-id', name: 'namespace' })
    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName,
    })

    await expect(
      catalog.namespaceExists({ warehouse: 'warehouse', namespace: 'namespace' })
    ).resolves.toBeUndefined()

    expect(findNamespaceByName).toHaveBeenCalledWith({
      tenantId: 'tenant-id',
      name: 'namespace',
      catalogId: 'catalog-id',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a local missing namespace row to NoSuchNamespaceException', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName: vi.fn().mockRejectedValue(ERRORS.NoSuchKey('namespace')),
    })

    await expect(
      catalog.namespaceExists({ warehouse: 'warehouse', namespace: 'namespace' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'Namespace not found',
      type: IcebergErrorType.NoSuchNamespaceException,
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('TenantAwareRestCatalog metadata loads', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps a missing warehouse distinct for loadTable', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockRejectedValue(ERRORS.NoSuchCatalog('warehouse')),
    })

    await expectNoSuchCatalog(
      catalog.loadTable({ warehouse: 'warehouse', namespace: 'namespace', table: 'table' })
    )

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a local missing namespace row to NoSuchNamespaceException for loadTable', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName: vi.fn().mockRejectedValue(ERRORS.NoSuchKey('namespace')),
    })

    await expect(
      catalog.loadTable({ warehouse: 'warehouse', namespace: 'namespace', table: 'table' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'Namespace not found',
      type: IcebergErrorType.NoSuchNamespaceException,
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a local missing table row to NoSuchTableException for loadTable', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName: vi.fn().mockResolvedValue({ id: 'namespace-id', name: 'namespace' }),
      findTableByName: vi.fn().mockRejectedValue(ERRORS.NoSuchKey('table')),
    })

    await expect(
      catalog.loadTable({ warehouse: 'warehouse', namespace: 'namespace', table: 'table' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'Table not found',
      type: IcebergErrorType.NoSuchTableException,
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws ShardNotFound when the loadTable row has no shard_key', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName: vi.fn().mockResolvedValue({ id: 'namespace-id', name: 'namespace' }),
      findTableByName: vi.fn().mockResolvedValue({ id: 'table-id', name: 'table' }),
    })

    await expect(
      catalog.loadTable({ warehouse: 'warehouse', namespace: 'namespace', table: 'table' })
    ).rejects.toMatchObject({
      code: ErrorCode.ShardNotFound,
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps a missing warehouse distinct for loadNamespaceMetadata', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockRejectedValue(ERRORS.NoSuchCatalog('warehouse')),
    })

    await expectNoSuchCatalog(
      catalog.loadNamespaceMetadata({ warehouse: 'warehouse', namespace: 'namespace' })
    )

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a local missing namespace row to NoSuchNamespaceException for loadNamespaceMetadata', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName: vi.fn().mockRejectedValue(ERRORS.NoSuchKey('namespace')),
    })

    await expect(
      catalog.loadNamespaceMetadata({ warehouse: 'warehouse', namespace: 'namespace' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'Namespace not found',
      type: IcebergErrorType.NoSuchNamespaceException,
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a local missing namespace row to NoSuchNamespaceException for listTables', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const listTables = vi.fn()

    const catalog = createCatalog({
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName: vi.fn().mockRejectedValue(ERRORS.NoSuchKey('namespace')),
      listTables,
    })

    await expect(
      catalog.listTables({ warehouse: 'warehouse', namespace: 'namespace' })
    ).rejects.toMatchObject({
      code: 404,
      message: 'Namespace not found',
      type: IcebergErrorType.NoSuchNamespaceException,
    })

    expect(listTables).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('TenantAwareRestCatalog resource mutations', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps a local missing namespace row to NoSuchNamespaceException for createTable', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const store = {
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName: vi.fn().mockRejectedValue(ERRORS.NoSuchKey('namespace')),
    }
    const transaction = vi.fn(async (callback) => callback(store))
    const catalog = createCatalog({ transaction })

    await expect(
      catalog.createTable({
        warehouse: 'warehouse',
        namespace: 'namespace',
        name: 'table',
        schema: { type: 'struct', fields: [] },
        spec: { fields: [] },
      })
    ).rejects.toMatchObject({
      code: 404,
      message: 'Namespace not found',
      type: IcebergErrorType.NoSuchNamespaceException,
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a local duplicate table row to AlreadyExistsException for createTable', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const store = {
      findCatalogByName: vi.fn().mockResolvedValue({ id: 'catalog-id', name: 'warehouse' }),
      findNamespaceByName: vi.fn().mockResolvedValue({ id: 'namespace-id', name: 'namespace' }),
      findTableByName: vi.fn().mockResolvedValue({ id: 'table-id', name: 'table' }),
    }
    const transaction = vi.fn(async (callback) => callback(store))
    const catalog = createCatalog({ transaction })

    await expect(
      catalog.createTable({
        warehouse: 'warehouse',
        namespace: 'namespace',
        name: 'table',
        schema: { type: 'struct', fields: [] },
        spec: { fields: [] },
      })
    ).rejects.toMatchObject({
      code: 409,
      message: 'Table already exists',
      type: IcebergErrorType.AlreadyExistsException,
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
