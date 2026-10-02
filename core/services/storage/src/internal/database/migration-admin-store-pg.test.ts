import type { DatabaseExecutor, DatabaseStatement } from './connection'
import { MigrationAdminStorePg } from './migration-admin-store-pg'

function createMigrationAdminStore() {
  const query = vi.fn().mockResolvedValue({
    rows: [],
    rowCount: 1,
  })
  const db = { query } as unknown as DatabaseExecutor
  const store = new MigrationAdminStorePg(db, 'pgboss')

  return { query, store }
}

function getLastStatement(query: ReturnType<typeof vi.fn>): DatabaseStatement {
  const [statement] = query.mock.calls.at(-1) || []

  if (!statement || typeof statement === 'string') {
    throw new Error('Expected a DatabaseStatement query')
  }

  return statement
}

describe('MigrationAdminStorePg', () => {
  it('does not add an internal timeout to admin pg-boss queries', async () => {
    const { query, store } = createMigrationAdminStore()

    await store.listActiveJobs('migrations', 2000)

    expect(query).toHaveBeenCalledWith(expect.anything())
  })

  it('completes only a limited page of active jobs', async () => {
    const { query, store } = createMigrationAdminStore()

    await store.completeActiveJobs('migrations', 2000)

    const statement = getLastStatement(query)
    expect(statement.text).toMatch(/\bWITH jobs_to_update AS\b/i)
    expect(statement.text).toMatch(/\bLIMIT \$2\b/i)
    expect(statement.text).toMatch(
      /WHERE job\.id = jobs_to_update\.id\s+AND job\.state = 'active'/i
    )
    expect(statement.values).toEqual(['migrations', 2000])
  })

  it('deletes only a limited page of tenant jobs', async () => {
    const { query, store } = createMigrationAdminStore()

    await store.deleteTenantJobs('tenant-id', 'migrations', 100)

    const statement = getLastStatement(query)
    expect(statement.text).toMatch(/\bWITH jobs_to_delete AS\b/i)
    expect(statement.text).toMatch(/\bLIMIT \$3\b/i)
    expect(statement.values).toEqual(['tenant-id', 'migrations', 100])
  })
})
