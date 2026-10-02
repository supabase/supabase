import { describe, expect, it, vi } from 'vitest'
import { PgMetastore } from './pg'

function createMetastore(query: ReturnType<typeof vi.fn>) {
  return new PgMetastore({ query } as never, {
    multiTenant: false,
    schema: 'storage',
  })
}

function getLastStatement(query: ReturnType<typeof vi.fn>): string {
  const [statement] = query.mock.calls.at(-1) || []

  if (!statement) {
    throw new Error('No query calls found')
  }

  if (typeof statement === 'string') {
    return statement
  }

  if (typeof statement === 'object' && 'text' in statement) {
    return String(statement.text)
  }

  throw new Error('Expected a DatabaseStatement query with text property')
}

describe('PgMetastore.countCatalogs', () => {
  it('excludes soft-deleted catalogs by default', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ count: 5 }] })
    const metastore = createMetastore(query)

    await metastore.countCatalogs({
      tenantId: 'tenant-id',
      limit: 100,
    })

    const statement = getLastStatement(query)
    expect(statement).toContain('deleted_at IS NULL')
  })

  it('includes soft-deleted catalogs when deleted parameter is true', async () => {
    const query = vi.fn().mockResolvedValue({ rows: [{ count: 10 }] })
    const metastore = createMetastore(query)

    await metastore.countCatalogs({
      tenantId: 'tenant-id',
      limit: 100,
      deleted: true,
    })

    const statement = getLastStatement(query)
    expect(statement).not.toContain('deleted_at IS NULL')
  })
})
