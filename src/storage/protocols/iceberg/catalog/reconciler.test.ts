import { IcebergCatalogReconciler } from './reconciler'
import type { RestCatalogClient } from './rest-catalog-client'

function createReconciler() {
  return new IcebergCatalogReconciler({} as RestCatalogClient) as unknown as {
    findCatalogByName: (
      tnx: { query: ReturnType<typeof vi.fn> },
      tenantId: string,
      catalogName: string
    ) => Promise<unknown>
    findFirstCatalog: (
      tnx: { query: ReturnType<typeof vi.fn> },
      tenantId: string
    ) => Promise<unknown>
  }
}

function getLastStatement(query: ReturnType<typeof vi.fn>): string {
  const [statement] = query.mock.calls.at(-1) || []

  if (!statement || typeof statement === 'string') {
    throw new Error('Expected a DatabaseStatement query')
  }

  return String((statement as { text: string }).text)
}

describe('IcebergCatalogReconciler', () => {
  it('ignores soft-deleted catalogs when finding an upstream orphan catalog by name', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const reconciler = createReconciler()

    await reconciler.findCatalogByName({ query }, 'tenant-id', 'catalog-name')

    expect(getLastStatement(query)).toContain('deleted_at IS NULL')
  })

  it('ignores soft-deleted catalogs when falling back to the first tenant catalog', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [] })
    const reconciler = createReconciler()

    await reconciler.findFirstCatalog({ query }, 'tenant-id')

    expect(getLastStatement(query)).toContain('deleted_at IS NULL')
  })
})
